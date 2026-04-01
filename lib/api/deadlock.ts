import "server-only";

import type {
  DeadlockHero,
  DeadlockItem,
  DeadlockRank,
  DeadlockPlayerHeroStat,
  DeadlockMatchMetadata,
  DeadlockHeroAnalytics,
  DeadlockPlayerMetrics,
  DeadlockLeaderboardEntry,
  DeadlockItemStats,
  DeadlockMatchItemPurchase,
  DeadlockApiInfo,
} from "./types";
import { ApiError } from "./types";
import logger from "@/lib/logger";
import { cacheGet, cacheSet } from "@/lib/cache";

const ASSETS_API = "https://assets.deadlock-api.com";
const GAME_API = "https://api.deadlock-api.com";

async function deadlockFetch<T>(url: string, revalidate: number): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { next: { revalidate }, signal: AbortSignal.timeout(10_000) });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      logger.error({ url }, "Deadlock API timeout");
      throw new ApiError("Request timeout", 408, url);
    }
    throw err;
  }

  if (!res.ok) {
    logger.warn({ url, status: res.status }, "Deadlock API error");
    throw new ApiError(
      `Deadlock API error: ${res.statusText}`,
      res.status,
      url,
    );
  }

  return res.json() as Promise<T>;
}

// ---- Assets API ----

export async function getHeroes(): Promise<DeadlockHero[]> {
  return deadlockFetch<DeadlockHero[]>(
    `${ASSETS_API}/v2/heroes`,
    604800,
  );
}

export async function getHero(heroId: number): Promise<DeadlockHero> {
  return deadlockFetch<DeadlockHero>(
    `${ASSETS_API}/v2/heroes/${heroId}`,
    604800,
  );
}

// In-memory cache for items (2.5MB response exceeds Next.js 2MB fetch cache limit).
// Stores the in-flight promise to prevent thundering herd on concurrent requests.
let itemsPromise: Promise<DeadlockItem[]> | null = null;
let itemsExpiry = 0;
const ITEMS_CACHE_TTL = 604800_000; // 7 days

export async function getItems(): Promise<DeadlockItem[]> {
  if (itemsPromise && Date.now() < itemsExpiry) {
    return itemsPromise;
  }

  itemsExpiry = Date.now() + ITEMS_CACHE_TTL;
  const itemsUrl = `${ASSETS_API}/v2/items/by-type/upgrade`;
  itemsPromise = (async () => {
    let res: Response;
    try {
      res = await fetch(itemsUrl, {
        next: { revalidate: 604800 },
        signal: AbortSignal.timeout(10_000),
      });
    } catch (err) {
      if (err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError")) {
        logger.error({ url: itemsUrl }, "Items API timeout");
        throw new ApiError("Request timeout", 408, itemsUrl);
      }
      throw err;
    }
    if (!res.ok) {
      logger.warn({ url: res.url, status: res.status }, "Deadlock API error");
      throw new ApiError(`Deadlock API error: ${res.statusText}`, res.status, res.url);
    }
    return res.json() as Promise<DeadlockItem[]>;
  })().catch((err) => {
    // Reset cache on failure so next request retries
    itemsPromise = null;
    itemsExpiry = 0;
    throw err;
  });

  return itemsPromise;
}

export async function getItemStats(minBadge?: number): Promise<DeadlockItemStats[]> {
  const params = minBadge != null ? `?min_average_badge=${minBadge}` : "";
  return deadlockFetch<DeadlockItemStats[]>(
    `${GAME_API}/v1/analytics/item-stats${params}`,
    604800,
  );
}

export async function getRanks(): Promise<DeadlockRank[]> {
  return deadlockFetch<DeadlockRank[]>(
    `${ASSETS_API}/v2/ranks`,
    604800,
  );
}

// ---- Game Data API ----

export async function getPlayerHeroStats(
  accountId: number,
): Promise<DeadlockPlayerHeroStat[]> {
  const cacheKey = `phs:${accountId}`;
  const cached = await cacheGet<DeadlockPlayerHeroStat[]>(cacheKey);
  if (cached) return cached;

  const data = await deadlockFetch<DeadlockPlayerHeroStat[]>(
    `${GAME_API}/v1/players/hero-stats?account_ids=${accountId}`,
    604800,
  );
  await cacheSet(cacheKey, data, 604800);
  return data;
}

export async function getBatchPlayerHeroStats(
  accountIds: number[],
): Promise<DeadlockPlayerHeroStat[]> {
  if (accountIds.length === 0) return [];
  return deadlockFetch<DeadlockPlayerHeroStat[]>(
    `${GAME_API}/v1/players/hero-stats?account_ids=${accountIds.join(",")}`,
    604800,
  );
}

export async function getMatchHistory(
  accountId: number,
  limit: number = 20,
): Promise<DeadlockMatchMetadata[]> {
  return deadlockFetch<DeadlockMatchMetadata[]>(
    `${GAME_API}/v1/matches/metadata?account_ids=${accountId}&include_player_info=true&limit=${limit}&order_by=start_time&order_direction=desc`,
    604800,
  );
}

export async function getMatchDetail(
  matchId: number,
): Promise<DeadlockMatchMetadata> {
  // Use the bulk metadata endpoint with a tight match ID range.
  // The single-match endpoint (/v1/matches/{id}/metadata) returns
  // a different schema with numeric enums instead of strings.
  const results = await deadlockFetch<DeadlockMatchMetadata[]>(
    `${GAME_API}/v1/matches/metadata?min_match_id=${matchId}&max_match_id=${matchId}&include_player_info=true`,
    604800,
  );
  if (results.length === 0) {
    throw new ApiError("Match not found", 404, `matches/${matchId}`);
  }
  return results[0];
}

/**
 * Fetch per-player item purchases from the single match endpoint.
 * Returns a map of account_id → unsold item_ids.
 */
export async function getMatchPlayerItems(
  matchId: number,
): Promise<Map<number, number[]>> {
  interface RawMatchDetail {
    match_info: {
      players: {
        account_id: number;
        items?: DeadlockMatchItemPurchase[];
      }[];
    };
  }

  const data = await deadlockFetch<RawMatchDetail>(
    `${GAME_API}/v1/matches/${matchId}/metadata`,
    604800,
  );

  const result = new Map<number, number[]>();
  for (const player of data.match_info.players) {
    const items = player.items ?? [];
    // Get unique unsold item_ids (sold_time_s === 0)
    const unsoldIds = [...new Set(
      items
        .filter((i) => i.sold_time_s === 0)
        .map((i) => i.item_id),
    )];
    result.set(player.account_id, unsoldIds);
  }
  return result;
}

export async function getApiInfo(): Promise<DeadlockApiInfo> {
  return deadlockFetch<DeadlockApiInfo>(
    `${GAME_API}/v1/info`,
    604800,
  );
}

export async function getHeroAnalytics(): Promise<DeadlockHeroAnalytics[]> {
  return deadlockFetch<DeadlockHeroAnalytics[]>(
    `${GAME_API}/v1/analytics/hero-stats?bucket=avg_badge`,
    604800,
  );
}

export async function getPlayerMetrics(
  accountId: number,
): Promise<DeadlockPlayerMetrics> {
  const cacheKey = `pm:${accountId}`;
  const cached = await cacheGet<DeadlockPlayerMetrics>(cacheKey);
  if (cached) return cached;

  const data = await deadlockFetch<DeadlockPlayerMetrics>(
    `${GAME_API}/v1/analytics/player-stats/metrics?account_ids=${accountId}`,
    604800,
  );
  await cacheSet(cacheKey, data, 604800);
  return data;
}

export type DeadlockRegion =
  | "NAmerica"
  | "SAmerica"
  | "Europe"
  | "Asia"
  | "Oceania";

export async function getLeaderboard(
  region: DeadlockRegion,
): Promise<DeadlockLeaderboardEntry[]> {
  const cacheKey = `lb:${region}`;
  const cached = await cacheGet<DeadlockLeaderboardEntry[]>(cacheKey);
  if (cached) return cached;

  const data = await deadlockFetch<{ entries: DeadlockLeaderboardEntry[] }>(
    `${GAME_API}/v1/leaderboard/${region}`,
    604800,
  );
  await cacheSet(cacheKey, data.entries, 604800);
  return data.entries;
}

const ALL_REGIONS: DeadlockRegion[] = [
  "NAmerica",
  "SAmerica",
  "Europe",
  "Asia",
  "Oceania",
];

export interface LeaderboardSearchMatch {
  accountId: number;
  possibleAccountIds: number[];
  accountName: string;
  rank: number;
  rankedRank: number;
  rankedSubrank: number;
  topHeroIds: number[];
  region: DeadlockRegion;
}

const MAX_LEADERBOARD_RESULTS = 15;

/**
 * Search all regional leaderboards for players by in-game name.
 * Prefers exact/prefix matches first and only falls back to substring matches
 * when no higher-signal results exist.
 */
export async function searchLeaderboardByName(
  name: string,
): Promise<LeaderboardSearchMatch[]> {
  const needle = name.toLowerCase();

  if (needle.length < 3) return [];

  const boards = await Promise.all(ALL_REGIONS.map(getLeaderboard));
  const exactAndPrefixMatches: (LeaderboardSearchMatch & { _relevance: number })[] = [];
  const substringMatches: (LeaderboardSearchMatch & { _relevance: number })[] = [];

  for (let i = 0; i < boards.length; i++) {
    const region = ALL_REGIONS[i];
    for (const entry of boards[i]) {
      if (entry.possible_account_ids.length === 0) continue;

      const lower = entry.account_name.toLowerCase();
      let relevance: number;

      if (lower === needle) {
        relevance = 0; // exact
      } else if (lower.startsWith(needle)) {
        relevance = 1; // prefix
      } else if (lower.includes(needle)) {
        relevance = 2; // substring
      } else {
        continue;
      }

      const match = {
        accountId: entry.possible_account_ids[0],
        possibleAccountIds: entry.possible_account_ids,
        accountName: entry.account_name,
        rank: entry.rank,
        rankedRank: entry.ranked_rank,
        rankedSubrank: entry.ranked_subrank,
        topHeroIds: entry.top_hero_ids,
        region,
        _relevance: relevance,
      };

      if (relevance <= 1) {
        exactAndPrefixMatches.push(match);
      } else {
        substringMatches.push(match);
      }
    }
  }

  const matches = exactAndPrefixMatches.length > 0
    ? exactAndPrefixMatches
    : substringMatches;

  matches.sort((a, b) => a._relevance - b._relevance || a.rank - b.rank);

  return matches.slice(0, MAX_LEADERBOARD_RESULTS).map((m) => ({
    accountId: m.accountId,
    possibleAccountIds: m.possibleAccountIds,
    accountName: m.accountName,
    rank: m.rank,
    rankedRank: m.rankedRank,
    rankedSubrank: m.rankedSubrank,
    topHeroIds: m.topHeroIds,
    region: m.region,
  }));
}
