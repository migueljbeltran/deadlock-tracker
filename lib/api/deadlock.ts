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
  const res = await fetch(url, { next: { revalidate } });

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

export async function getItems(): Promise<DeadlockItem[]> {
  return deadlockFetch<DeadlockItem[]>(
    `${ASSETS_API}/v2/items/by-type/upgrade`,
    3600,
  );
}

export async function getItemStats(minBadge?: number): Promise<DeadlockItemStats[]> {
  const params = minBadge != null ? `?min_average_badge=${minBadge}` : "";
  return deadlockFetch<DeadlockItemStats[]>(
    `${GAME_API}/v1/analytics/item-stats${params}`,
    1800,
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
    300,
  );
}

export async function getBatchPlayerHeroStats(
  accountIds: number[],
): Promise<DeadlockPlayerHeroStat[]> {
  if (accountIds.length === 0) return [];
  return deadlockFetch<DeadlockPlayerHeroStat[]>(
    `${GAME_API}/v1/players/hero-stats?account_ids=${accountIds.join(",")}`,
    300,
  );
}

export async function getMatchHistory(
  accountId: number,
  limit: number = 20,
): Promise<DeadlockMatchMetadata[]> {
  return deadlockFetch<DeadlockMatchMetadata[]>(
    `${GAME_API}/v1/matches/metadata?account_ids=${accountId}&include_player_info=true&limit=${limit}&order_by=start_time&order_direction=desc`,
    120,
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
    1800,
  );
}

export async function getHeroAnalytics(): Promise<DeadlockHeroAnalytics[]> {
  return deadlockFetch<DeadlockHeroAnalytics[]>(
    `${GAME_API}/v1/analytics/hero-stats?bucket=avg_badge`,
    1800,
  );
}

export async function getPlayerMetrics(
  accountId: number,
): Promise<DeadlockPlayerMetrics> {
  return deadlockFetch<DeadlockPlayerMetrics>(
    `${GAME_API}/v1/analytics/player-stats/metrics?account_ids=${accountId}`,
    300,
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
    600,
  );
  return data.entries;
}
