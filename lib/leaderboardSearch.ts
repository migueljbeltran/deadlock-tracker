import "server-only";

import type { DeadlockLeaderboardEntry, DeadlockRegion, LeaderboardSearchMatch } from "@/lib/api";
import { searchLeaderboardByName as searchLeaderboardByNameLive } from "@/lib/api/deadlock";
import { cacheDelete, cacheGet, cacheSet, cacheSetIfNotExists, isCacheAvailable } from "@/lib/cache";
import logger from "@/lib/logger";

const GAME_API = "https://api.deadlock-api.com";
const CORPUS_KEY = "leaderboard-search:corpus:v1";
const CORPUS_LOCK_KEY = "leaderboard-search-refresh-lock";
const CORPUS_FRESHNESS_SECONDS = 86400;
const CORPUS_TTL_SECONDS = 604800;
const CORPUS_LOCK_TTL_SECONDS = 300;
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

function isCorpusStale(corpus: LeaderboardSearchCorpus): boolean {
  const fetchedAt = Date.parse(corpus.fetchedAt);
  if (Number.isNaN(fetchedAt)) return true;
  return (Date.now() - fetchedAt) / 1000 >= CORPUS_FRESHNESS_SECONDS;
}

async function fetchLiveLeaderboard(region: DeadlockRegion): Promise<DeadlockLeaderboardEntry[]> {
  const res = await fetch(`${GAME_API}/v1/leaderboard/${region}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    throw new Error(`Leaderboard fetch failed for ${region}: ${res.status}`);
  }

  const data = await res.json() as { entries: DeadlockLeaderboardEntry[] };
  return data.entries;
}

async function buildLeaderboardSearchCorpus(): Promise<LeaderboardSearchCorpus> {
  const boards = await Promise.all(ALL_REGIONS.map(fetchLiveLeaderboard));
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

  const corpus: LeaderboardSearchCorpus = {
    fetchedAt: new Date().toISOString(),
    entries,
  };

  await cacheSet(CORPUS_KEY, corpus, CORPUS_TTL_SECONDS);
  logger.info({ entries: entries.length }, "Leaderboard search corpus rebuilt");
  return corpus;
}

async function getLeaderboardSearchCorpus(): Promise<LeaderboardSearchCorpus | null> {
  if (!isCacheAvailable()) return null;

  const cached = await cacheGet<LeaderboardSearchCorpus>(CORPUS_KEY);
  if (!cached) {
    const lockAcquired = await cacheSetIfNotExists(CORPUS_LOCK_KEY, "1", CORPUS_LOCK_TTL_SECONDS);
    if (!lockAcquired) return null;

    try {
      return await buildLeaderboardSearchCorpus();
    } finally {
      await cacheDelete(CORPUS_LOCK_KEY);
    }
  }

  if (!isCorpusStale(cached)) {
    return cached;
  }

  const lockAcquired = await cacheSetIfNotExists(CORPUS_LOCK_KEY, "1", CORPUS_LOCK_TTL_SECONDS);
  if (!lockAcquired) {
    logger.info("Leaderboard corpus stale but refresh lock is held; serving stale corpus");
    return cached;
  }

  try {
    return await buildLeaderboardSearchCorpus();
  } catch (error) {
    logger.warn({ error }, "Leaderboard corpus rebuild failed; serving stale corpus");
    return cached;
  } finally {
    await cacheDelete(CORPUS_LOCK_KEY);
  }
}

export async function searchLeaderboardByNameCached(
  name: string,
): Promise<LeaderboardSearchMatch[]> {
  const needle = name.toLowerCase();

  if (needle.length < 3) return [];

  const corpus = await getLeaderboardSearchCorpus();
  if (!corpus) {
    return searchLeaderboardByNameLive(name);
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
