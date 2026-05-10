import "server-only";

import type { DeadlockLeaderboardEntry } from "@/lib/api/types";
import { getLeaderboard, type DeadlockRegion, type LeaderboardSearchMatch } from "@/lib/api/deadlock";
import { cacheGetOrBuildSnapshot } from "@/lib/cache";
import logger from "@/lib/logger";

const CORPUS_KEY = "leaderboard-search:corpus:v2";
const CORPUS_FRESHNESS_SECONDS = 86400;
const CORPUS_TTL_SECONDS = 604800;
const CORPUS_LOCK_TTL_SECONDS = 600;
const MAX_LEADERBOARD_RESULTS = 15;

const ALL_REGIONS: DeadlockRegion[] = [
  "NAmerica",
  "SAmerica",
  "Europe",
  "Asia",
  "Oceania",
];

interface CachedLeaderboardSearchEntry {
  accountId: number;
  possibleAccountIds: number[];
  accountName: string;
  normalizedName: string;
  rank: number;
  rankedRank: number;
  rankedSubrank: number;
  topHeroIds: number[];
  region: DeadlockRegion;
}

interface LeaderboardSearchCorpus {
  fetchedAt: string;
  entries: CachedLeaderboardSearchEntry[];
}

async function buildLeaderboardSearchEntries(): Promise<CachedLeaderboardSearchEntry[]> {
  const boards: DeadlockLeaderboardEntry[][] = await Promise.all(ALL_REGIONS.map(getLeaderboard));
  const entries: CachedLeaderboardSearchEntry[] = [];

  for (let i = 0; i < boards.length; i++) {
    const region = ALL_REGIONS[i];
    for (const entry of boards[i]) {
      if (entry.possible_account_ids.length === 0) continue;
      entries.push({
        accountId: entry.possible_account_ids[0],
        possibleAccountIds: entry.possible_account_ids,
        accountName: entry.account_name,
        normalizedName: entry.account_name.toLowerCase(),
        rank: entry.rank,
        rankedRank: entry.ranked_rank,
        rankedSubrank: entry.ranked_subrank,
        topHeroIds: entry.top_hero_ids,
        region,
      });
    }
  }

  logger.info({ entries: entries.length }, "Leaderboard search corpus rebuilt");
  return entries;
}

async function getLeaderboardSearchCorpus(): Promise<LeaderboardSearchCorpus | null> {
  const snapshot = await cacheGetOrBuildSnapshot({
    key: CORPUS_KEY,
    label: "leaderboard-search-corpus",
    ttlSeconds: CORPUS_TTL_SECONDS,
    freshnessSeconds: CORPUS_FRESHNESS_SECONDS,
    lockTtlSeconds: CORPUS_LOCK_TTL_SECONDS,
    builder: buildLeaderboardSearchEntries,
  });

  return snapshot
    ? { fetchedAt: snapshot.fetchedAt, entries: snapshot.data }
    : null;
}

export async function searchLeaderboardByNameCached(
  name: string,
): Promise<LeaderboardSearchMatch[]> {
  const needle = name.toLowerCase();

  if (needle.length < 3) return [];

  const corpus = await getLeaderboardSearchCorpus();
  if (!corpus) {
    // Corpus unavailable (Redis down or rebuild in progress).
    // Return empty rather than triggering a 5-region live fan-out on every search.
    return [];
  }

  const exactAndPrefixMatches: (LeaderboardSearchMatch & { _relevance: number })[] = [];
  const substringMatches: (LeaderboardSearchMatch & { _relevance: number })[] = [];

  for (const entry of corpus.entries) {
    let relevance: number;

    if (entry.normalizedName === needle) {
      relevance = 0;
    } else if (entry.normalizedName.startsWith(needle)) {
      relevance = 1;
    } else if (entry.normalizedName.includes(needle)) {
      relevance = 2;
    } else {
      continue;
    }

    const match = {
      accountId: entry.accountId,
      possibleAccountIds: entry.possibleAccountIds,
      accountName: entry.accountName,
      rank: entry.rank,
      rankedRank: entry.rankedRank,
      rankedSubrank: entry.rankedSubrank,
      topHeroIds: entry.topHeroIds,
      region: entry.region,
      _relevance: relevance,
    };

    if (relevance <= 1) {
      exactAndPrefixMatches.push(match);
    } else {
      substringMatches.push(match);
    }
  }

  const matches = exactAndPrefixMatches.length > 0
    ? exactAndPrefixMatches
    : substringMatches;

  matches.sort((a, b) => a._relevance - b._relevance || a.rank - b.rank);

  return matches.slice(0, MAX_LEADERBOARD_RESULTS).map((match) => ({
    accountId: match.accountId,
    possibleAccountIds: match.possibleAccountIds,
    accountName: match.accountName,
    rank: match.rank,
    rankedRank: match.rankedRank,
    rankedSubrank: match.rankedSubrank,
    topHeroIds: match.topHeroIds,
    region: match.region,
  }));
}
