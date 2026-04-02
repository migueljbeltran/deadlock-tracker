import "server-only";

import { getPlayerSummaries, getBatchPlayerHeroStats, accountIdToSteam64 } from "./index";
import logger from "@/lib/logger";

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
const PRIMARY_CANDIDATE_LIMIT = 5;
const FALLBACK_CANDIDATE_LIMIT = 20;
/** Max IDs per Steam API call */
const STEAM_BATCH_SIZE = 100;
/** Max IDs per hero-stats API call */
const HERO_STATS_BATCH_SIZE = 75;
const CONFIDENT_SCORE_THRESHOLD = 10;

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
interface ScoreInputs {
  nameMap: Map<number, string>;
  heroDataMap: Map<number, { allHeroIds: Set<number>; totalMatches: number }>;
}

interface CandidateFetchResult extends ScoreInputs {
  fetchedCandidateCount: number;
}

interface ScoredResolution {
  accountId: number;
  bestScore: number;
}

function scoreEntry(
  entry: ResolvableEntry,
  candidateIds: number[],
  inputs: ScoreInputs,
): ScoredResolution {
  const target = entry.account_name.toLowerCase();
  const entryTopHeroes = new Set(entry.top_hero_ids);

  let bestId = candidateIds[0] ?? entry.possible_account_ids[0];
  let bestScore = -Infinity;

  for (const id of candidateIds) {
    let score = 0;

    const steamName = inputs.nameMap.get(id);
    if (steamName) {
      const name = steamName.toLowerCase();
      if (name === target) {
        score += 10;
      } else if (name.includes(target) || target.includes(name)) {
        score += 3;
      }
    }

    const heroData = inputs.heroDataMap.get(id);
    if (heroData && heroData.allHeroIds.size > 0) {
      let overlap = 0;
      for (const heroId of entryTopHeroes) {
        if (heroData.allHeroIds.has(heroId)) overlap++;
      }
      score += overlap * 5;

      if (heroData.totalMatches > 0) {
        score += Math.min(10, Math.floor(Math.log10(heroData.totalMatches) * 4));
      }
    } else {
      score -= 100;
    }

    if (score > bestScore) {
      bestScore = score;
      bestId = id;
    }
  }

  return { accountId: bestId, bestScore };
}

async function fetchCandidateData(candidateIds: number[]): Promise<CandidateFetchResult> {
  if (candidateIds.length === 0) {
    return {
      nameMap: new Map(),
      heroDataMap: new Map(),
      fetchedCandidateCount: 0,
    };
  }

  const steam64Map = new Map<string, number>();
  const steam64List = candidateIds.map((id) => {
    const s64 = accountIdToSteam64(id);
    steam64Map.set(s64, id);
    return s64;
  });

  const steamBatches: string[][] = [];
  for (let i = 0; i < steam64List.length; i += STEAM_BATCH_SIZE) {
    steamBatches.push(steam64List.slice(i, i + STEAM_BATCH_SIZE));
  }

  const heroBatches: number[][] = [];
  for (let i = 0; i < candidateIds.length; i += HERO_STATS_BATCH_SIZE) {
    heroBatches.push(candidateIds.slice(i, i + HERO_STATS_BATCH_SIZE));
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

  const nameMap = new Map<number, string>();
  for (const players of steamResults) {
    for (const p of players) {
      const accountId = steam64Map.get(p.steamid);
      if (accountId != null) {
        nameMap.set(accountId, p.personaname);
      }
    }
  }

  const heroDataMap = new Map<number, { allHeroIds: Set<number>; totalMatches: number }>();
  for (const stat of heroStatsResults.flat()) {
    const existing = heroDataMap.get(stat.account_id) ?? { allHeroIds: new Set(), totalMatches: 0 };
    existing.allHeroIds.add(stat.hero_id);
    existing.totalMatches += stat.matches_played;
    heroDataMap.set(stat.account_id, existing);
  }

  return { nameMap, heroDataMap, fetchedCandidateCount: candidateIds.length };
}

export async function resolveAccountIds(
  entries: ResolvableEntry[],
): Promise<Map<number, ResolvedAccount>> {
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

  const primaryCandidateIds = new Set<number>();
  for (const { entry } of ambiguous) {
    for (let i = 0; i < Math.min(entry.possible_account_ids.length, PRIMARY_CANDIDATE_LIMIT); i++) {
      primaryCandidateIds.add(entry.possible_account_ids[i]);
    }
  }

  const primaryData = await fetchCandidateData([...primaryCandidateIds]);
  const fetchedCandidateIds = new Set(primaryCandidateIds);
  const aggregateData: ScoreInputs = {
    nameMap: new Map(primaryData.nameMap),
    heroDataMap: new Map(primaryData.heroDataMap),
  };
  let totalFetchedCandidates = primaryData.fetchedCandidateCount;
  let fallbackExpandedEntries = 0;
  let confidentResolutions = 0;

  for (const { idx, entry } of ambiguous) {
    const primaryCandidates = entry.possible_account_ids.slice(0, PRIMARY_CANDIDATE_LIMIT);
    let scored = scoreEntry(entry, primaryCandidates, aggregateData);

    if (
      scored.bestScore < CONFIDENT_SCORE_THRESHOLD &&
      entry.possible_account_ids.length > PRIMARY_CANDIDATE_LIMIT
    ) {
      fallbackExpandedEntries++;
      const expandedCandidates = entry.possible_account_ids.slice(0, FALLBACK_CANDIDATE_LIMIT);
      const additionalIds = expandedCandidates.filter((id) => !fetchedCandidateIds.has(id));
      const fallbackData = await fetchCandidateData(additionalIds);
      totalFetchedCandidates += fallbackData.fetchedCandidateCount;
      for (const id of additionalIds) fetchedCandidateIds.add(id);
      for (const [id, name] of fallbackData.nameMap) aggregateData.nameMap.set(id, name);
      for (const [id, heroData] of fallbackData.heroDataMap) aggregateData.heroDataMap.set(id, heroData);
      scored = scoreEntry(entry, expandedCandidates, aggregateData);
    }

    const confident = scored.bestScore >= CONFIDENT_SCORE_THRESHOLD;
    if (confident) confidentResolutions++;
    resolved.set(idx, { accountId: scored.accountId, confident });
  }

  logger.info({
    entries: entries.length,
    ambiguous: ambiguous.length,
    confidentResolutions,
    fallbackExpandedEntries,
    fetchedCandidates: totalFetchedCandidates,
  }, "Account resolution complete");

  return resolved;
}
