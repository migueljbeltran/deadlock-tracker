import "server-only";

import { getPlayerSummaries, getBatchPlayerHeroStats, accountIdToSteam64 } from "./index";
import logger from "@/lib/logger";
import { cacheGet, cacheSet } from "@/lib/cache";

/** Minimal shape needed for account resolution — any object with these 3 fields works. */
export interface ResolvableEntry {
  account_name: string;
  possible_account_ids: number[];
  top_hero_ids: number[];
}

export interface ResolvedAccount {
  accountId: number;
  confident: boolean;
}

/** Max candidates to fetch per ambiguous entry (API orders by likelihood) */
const MAX_CANDIDATES = 5;
/** Max IDs per Steam API call */
const STEAM_BATCH_SIZE = 100;
/** Max IDs per hero-stats API call */
const HERO_STATS_BATCH_SIZE = 75;

/**
 * Resolve the best account ID for each entry using three signals:
 *
 * 1. **Steam name match** — batch-fetch profiles, compare persona names.
 * 2. **Hero pattern match** — batch-fetch hero stats, check overlap with `top_hero_ids`.
 * 3. **Match count** — leaderboard players have hundreds of matches;
 *    wrong accounts typically have very few.
 *
 * Returns an index-keyed map: entry array index → resolved account.
 * Entries with a single candidate are resolved immediately (confident).
 * Entries with zero candidates are skipped.
 */
/** Serializable version of the resolution map for Redis storage */
interface CachedResolution {
  /** entry index → resolved account */
  entries: Record<string, ResolvedAccount>;
  /** Hash of entry names to detect stale cache */
  entriesHash: string;
}

function hashEntries(entries: ResolvableEntry[]): string {
  // Hash all fields that influence resolution — names, candidate IDs, and hero signatures
  return entries.map((e) =>
    `${e.account_name}:${e.possible_account_ids.join(",")}:${e.top_hero_ids.join(",")}`
  ).join("|");
}

export async function resolveAccountIds(
  entries: ResolvableEntry[],
  region?: string,
  page?: number,
): Promise<Map<number, ResolvedAccount>> {
  // Check Redis cache for this region+page's resolution
  const currentHash = hashEntries(entries);
  if (region != null && page != null) {
    const cacheKey = `resolve:${region}:${page}`;
    const cached = await cacheGet<CachedResolution>(cacheKey);
    if (cached && cached.entriesHash === currentHash) {
      const map = new Map<number, ResolvedAccount>();
      for (const [k, v] of Object.entries(cached.entries)) {
        map.set(Number(k), v);
      }
      logger.debug({ region, page }, "Resolution cache hit");
      return map;
    }
  }

  const resolved = new Map<number, ResolvedAccount>();
  const ambiguous: { idx: number; entry: ResolvableEntry }[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (entry.possible_account_ids.length === 1) {
      resolved.set(i, { accountId: entry.possible_account_ids[0], confident: true });
    } else if (entry.possible_account_ids.length > 1) {
      ambiguous.push({ idx: i, entry });
    }
  }

  if (ambiguous.length === 0) return resolved;

  // Collect candidate account IDs, capped per entry
  const candidateIds = new Set<number>();
  for (const { entry } of ambiguous) {
    for (let i = 0; i < Math.min(entry.possible_account_ids.length, MAX_CANDIDATES); i++) {
      candidateIds.add(entry.possible_account_ids[i]);
    }
  }

  const heroStatsIds = [...candidateIds];
  const steamIds = [...candidateIds];

  // ── Parallel fetch: Steam profiles + Deadlock hero stats ──

  const steam64Map = new Map<string, number>();
  const steam64List = steamIds.map((id) => {
    const s64 = accountIdToSteam64(id);
    steam64Map.set(s64, id);
    return s64;
  });

  const steamBatches: string[][] = [];
  for (let i = 0; i < steam64List.length; i += STEAM_BATCH_SIZE) {
    steamBatches.push(steam64List.slice(i, i + STEAM_BATCH_SIZE));
  }

  const heroBatches: number[][] = [];
  for (let i = 0; i < heroStatsIds.length; i += HERO_STATS_BATCH_SIZE) {
    heroBatches.push(heroStatsIds.slice(i, i + HERO_STATS_BATCH_SIZE));
  }

  const [steamResults, heroStatsResults] = await Promise.all([
    Promise.all(
      steamBatches.map((batch) => getPlayerSummaries(batch).catch((err) => {
        logger.warn({ err, batchSize: batch.length }, "Steam batch fetch failed during account resolution");
        return [];
      })),
    ),
    Promise.all(
      heroBatches.map((batch) => getBatchPlayerHeroStats(batch).catch((err) => {
        logger.warn({ err, batchSize: batch.length }, "Hero stats batch fetch failed during account resolution");
        return [];
      })),
    ),
  ]);

  // Build nameMap: accountId → Steam persona name
  const nameMap = new Map<number, string>();
  for (const players of steamResults) {
    for (const p of players) {
      const accountId = steam64Map.get(p.steamid);
      if (accountId != null) {
        nameMap.set(accountId, p.personaname);
      }
    }
  }

  // Build hero data: accountId → { allHeroIds, totalMatches }
  const heroDataMap = new Map<number, { allHeroIds: Set<number>; totalMatches: number }>();
  for (const stat of heroStatsResults.flat()) {
    const existing = heroDataMap.get(stat.account_id) ?? { allHeroIds: new Set(), totalMatches: 0 };
    existing.allHeroIds.add(stat.hero_id);
    existing.totalMatches += stat.matches_played;
    heroDataMap.set(stat.account_id, existing);
  }

  // ── Score each candidate per ambiguous entry ──

  for (const { idx, entry } of ambiguous) {
    const target = entry.account_name.toLowerCase();
    const entryTopHeroes = new Set(entry.top_hero_ids);

    let bestId = entry.possible_account_ids[0];
    let bestScore = -Infinity;

    for (const id of entry.possible_account_ids) {
      let score = 0;

      // Signal 1: Name match (+10 exact, +3 partial)
      const steamName = nameMap.get(id);
      if (steamName) {
        const name = steamName.toLowerCase();
        if (name === target) {
          score += 10;
        } else if (name.includes(target) || target.includes(name)) {
          score += 3;
        }
      }

      // Signal 2: Hero overlap — check ALL of candidate's heroes against
      // the entry's top_hero_ids
      const heroData = heroDataMap.get(id);
      if (heroData && heroData.allHeroIds.size > 0) {
        let overlap = 0;
        for (const heroId of entryTopHeroes) {
          if (heroData.allHeroIds.has(heroId)) overlap++;
        }
        score += overlap * 5;

        // Signal 3: Match count — log scale
        if (heroData.totalMatches > 0) {
          score += Math.min(10, Math.floor(Math.log10(heroData.totalMatches) * 4));
        }
      } else {
        // No hero data = never played Deadlock = wrong account
        score -= 100;
      }

      if (score > bestScore) {
        bestScore = score;
        bestId = id;
      }
    }

    resolved.set(idx, { accountId: bestId, confident: bestScore >= 10 });
  }

  logger.debug({ entries: entries.length, ambiguous: ambiguous.length, candidates: candidateIds.size }, "Account resolution complete");

  // Store resolution in Redis for future ISR revalidations
  if (region != null && page != null) {
    const cacheKey = `resolve:${region}:${page}`;
    const serializable: CachedResolution = {
      entries: Object.fromEntries([...resolved.entries()].map(([k, v]) => [String(k), v])),
      entriesHash: currentHash,
    };
    await cacheSet(cacheKey, serializable, 172800); // 48h TTL
  }

  return resolved;
}
