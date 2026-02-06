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
} from "./types";
import { ApiError } from "./types";

const ASSETS_API = "https://assets.deadlock-api.com";
const GAME_API = "https://api.deadlock-api.com";

async function deadlockFetch<T>(url: string, revalidate: number): Promise<T> {
  const res = await fetch(url, { next: { revalidate } });

  if (!res.ok) {
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
    `${ASSETS_API}/v2/items`,
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
    300,
  );
}

export async function getMatchHistory(
  accountId: number,
  limit: number = 20,
): Promise<DeadlockMatchMetadata[]> {
  return deadlockFetch<DeadlockMatchMetadata[]>(
    `${GAME_API}/v1/matches/metadata?account_ids=${accountId}&include_player_info=true&limit=${limit}`,
    120,
  );
}

export async function getMatchDetail(
  matchId: number,
): Promise<DeadlockMatchMetadata> {
  return deadlockFetch<DeadlockMatchMetadata>(
    `${GAME_API}/v1/matches/${matchId}/metadata`,
    86400,
  );
}

export async function getHeroAnalytics(): Promise<DeadlockHeroAnalytics[]> {
  return deadlockFetch<DeadlockHeroAnalytics[]>(
    `${GAME_API}/v1/analytics/hero-stats`,
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
