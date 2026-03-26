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
    3600,
  );
}

export async function getHero(heroId: number): Promise<DeadlockHero> {
  return deadlockFetch<DeadlockHero>(
    `${ASSETS_API}/v2/heroes/${heroId}`,
    3600,
  );
}

// In-memory cache for items (2.5MB response exceeds Next.js 2MB fetch cache limit).
// Stores the in-flight promise to prevent thundering herd on concurrent requests.
let itemsPromise: Promise<DeadlockItem[]> | null = null;
let itemsExpiry = 0;
const ITEMS_CACHE_TTL = 3600_000; // 1 hour

export async function getItems(): Promise<DeadlockItem[]> {
  if (itemsPromise && Date.now() < itemsExpiry) {
    return itemsPromise;
  }

  itemsExpiry = Date.now() + ITEMS_CACHE_TTL;
  itemsPromise = (async () => {
    const res = await fetch(`${ASSETS_API}/v2/items/by-type/upgrade`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10_000),
    });
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
    3600,
  );
}

export async function getRanks(): Promise<DeadlockRank[]> {
  return deadlockFetch<DeadlockRank[]>(
    `${ASSETS_API}/v2/ranks`,
    86400,
  );
}

// ---- Game Data API ----

export async function getPlayerHeroStats(
  accountId: number,
): Promise<DeadlockPlayerHeroStat[]> {
  return deadlockFetch<DeadlockPlayerHeroStat[]>(
    `${GAME_API}/v1/players/hero-stats?account_ids=${accountId}`,
    600,
  );
}

export async function getBatchPlayerHeroStats(
  accountIds: number[],
): Promise<DeadlockPlayerHeroStat[]> {
  if (accountIds.length === 0) return [];
  return deadlockFetch<DeadlockPlayerHeroStat[]>(
    `${GAME_API}/v1/players/hero-stats?account_ids=${accountIds.join(",")}`,
    600,
  );
}

export async function getMatchHistory(
  accountId: number,
  limit: number = 20,
): Promise<DeadlockMatchMetadata[]> {
  return deadlockFetch<DeadlockMatchMetadata[]>(
    `${GAME_API}/v1/matches/metadata?account_ids=${accountId}&include_player_info=true&limit=${limit}&order_by=start_time&order_direction=desc`,
    300,
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
    86400,
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
    86400,
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
    3600,
  );
}

export async function getHeroAnalytics(): Promise<DeadlockHeroAnalytics[]> {
  return deadlockFetch<DeadlockHeroAnalytics[]>(
    `${GAME_API}/v1/analytics/hero-stats?bucket=avg_badge`,
    3600,
  );
}

export async function getPlayerMetrics(
  accountId: number,
): Promise<DeadlockPlayerMetrics> {
  return deadlockFetch<DeadlockPlayerMetrics>(
    `${GAME_API}/v1/analytics/player-stats/metrics?account_ids=${accountId}`,
    600,
  );
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
  const data = await deadlockFetch<{ entries: DeadlockLeaderboardEntry[] }>(
    `${GAME_API}/v1/leaderboard/${region}`,
    900,
  );
  return data.entries;
}

const ALL_REGIONS: DeadlockRegion[] = [
  "NAmerica",
  "SAmerica",
  "Europe",
  "Asia",
  "Oceania",
];

/**
 * Search all regional leaderboards for a player by in-game name.
 * Returns the first matching account ID, or null if not found.
 */
export async function searchLeaderboardByName(
  name: string,
): Promise<number | null> {
  const needle = name.toLowerCase();
  const boards = await Promise.all(ALL_REGIONS.map(getLeaderboard));

  for (const entries of boards) {
    const match = entries.find(
      (e) => e.account_name.toLowerCase() === needle,
    );
    if (match && match.possible_account_ids.length > 0) {
      return match.possible_account_ids[0];
    }
  }
  return null;
}
