import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { RegionSelector } from "@/components/leaderboard/RegionSelector";
import { Pagination } from "@/components/ui/Pagination";
import {
  getLeaderboard,
  getRanks,
  getHeroes,
  getPlayerSummaries,
  getBatchPlayerHeroStats,
  accountIdToSteam64,
} from "@/lib/api";
import type { DeadlockRegion, DeadlockLeaderboardEntry } from "@/lib/api";

const PAGE_SIZE = 100;

/** Max IDs per hero-stats API call */
const HERO_STATS_BATCH_SIZE = 75;
/** Max IDs per Steam API call */
const STEAM_BATCH_SIZE = 100;
/**
 * Cap candidates for entries with extreme numbers (e.g. "E" has 359).
 * The Deadlock API orders by likelihood, so the real account is usually
 * within the first ~30. We skip name-only resolution for entries beyond
 * this cap since it would bloat Steam API calls.
 */
const MAX_CANDIDATES_FOR_STEAM = 20;

/**
 * Resolve the best account ID for each leaderboard entry using three signals:
 *
 * 1. **Steam name match** — batch-fetch profiles, compare persona names.
 * 2. **Hero pattern match** — batch-fetch hero stats, check if candidate
 *    plays the same heroes as the leaderboard entry's `top_hero_ids`.
 * 3. **Match count** — leaderboard players have hundreds of matches;
 *    wrong accounts typically have very few.
 *
 * All fetches run in parallel. Candidates are scored and the highest wins.
 */
interface ResolvedAccount {
  accountId: number;
  confident: boolean;
}

async function resolveAccountIds(
  entries: DeadlockLeaderboardEntry[],
): Promise<Map<number, ResolvedAccount>> {
  const resolved = new Map<number, ResolvedAccount>();
  const ambiguous: { idx: number; entry: DeadlockLeaderboardEntry }[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (entry.possible_account_ids.length === 1) {
      resolved.set(i, { accountId: entry.possible_account_ids[0], confident: true });
    } else if (entry.possible_account_ids.length > 1) {
      ambiguous.push({ idx: i, entry });
    }
  }

  if (ambiguous.length === 0) return resolved;

  // Collect candidate account IDs, capped at MAX_CANDIDATES_FOR_STEAM per entry
  const candidateIds = new Set<number>();

  for (const { entry } of ambiguous) {
    for (let i = 0; i < Math.min(entry.possible_account_ids.length, MAX_CANDIDATES_FOR_STEAM); i++) {
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
      steamBatches.map((batch) => getPlayerSummaries(batch).catch(() => [])),
    ),
    Promise.all(
      heroBatches.map((batch) => getBatchPlayerHeroStats(batch).catch(() => [])),
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

  // Build hero data: accountId → { allHeroIds: Set, totalMatches: number }
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
      // the entry's top_hero_ids (not just top 5, since the leaderboard
      // hero may be their 6th-10th most played)
      const heroData = heroDataMap.get(id);
      if (heroData && heroData.allHeroIds.size > 0) {
        let overlap = 0;
        for (const heroId of entryTopHeroes) {
          if (heroData.allHeroIds.has(heroId)) overlap++;
        }
        score += overlap * 5;

        // Signal 3: Match count — leaderboard players play a LOT
        // Log scale so 400 matches doesn't 40x the score vs 10 matches,
        // but still gives a meaningful edge to active players
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

  return resolved;
}

const VALID_REGIONS: DeadlockRegion[] = ["NAmerica", "SAmerica", "Europe", "Asia", "Oceania"];

interface LeaderboardContentProps {
  searchParams: Promise<{ region?: string; page?: string }>;
}

export default async function LeaderboardContent({ searchParams }: LeaderboardContentProps) {
  const { region: regionParam, page: pageParam } = await searchParams;

  const region: DeadlockRegion = VALID_REGIONS.includes(regionParam as DeadlockRegion)
    ? (regionParam as DeadlockRegion)
    : "NAmerica";

  const rawPage = Number(pageParam);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  const [entries, ranks, heroes] = await Promise.all([
    getLeaderboard(region),
    getRanks(),
    getHeroes(),
  ]);

  const offset = (page - 1) * PAGE_SIZE;
  const pageEntries = entries.slice(offset, offset + PAGE_SIZE);
  const hasNextPage = entries.length > offset + PAGE_SIZE;

  const rankMap = new Map(ranks.map((r) => [r.tier, r]));
  const heroMap = new Map(heroes.map((h) => [h.id, h]));

  // Resolve ambiguous account IDs by matching Steam names
  const resolvedIds = await resolveAccountIds(pageEntries);

  return (
    <>
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl bg-clip-text text-transparent bg-gradient-to-b from-amber-light via-amber to-amber/70">
              Leaderboard
            </h1>
            <p className="mt-2 text-text-secondary">
              Top ranked players in Deadlock across all regions.
            </p>
          </div>
          <RegionSelector currentRegion={region} />
        </div>
      </div>

      <LeaderboardTable
        entries={pageEntries}
        rankMap={rankMap}
        heroMap={heroMap}
        resolvedAccountIds={resolvedIds}
      />

      <Pagination
        currentPage={page}
        hasNextPage={hasNextPage}
        baseUrl="/leaderboard"
        extraParams={{ region }}
      />
    </>
  );
}
