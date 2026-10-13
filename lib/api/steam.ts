import "server-only";
import { unstable_cache } from "next/cache";

import type {
  SteamResolveVanityResponse,
  SteamPlayerSummariesResponse,
  SteamPlayerSummary,
} from "./types";
import { ApiError } from "./types";
import {
  parseExternalData,
  steamPlayerSummariesResponseSchema,
  steamResolveVanityResponseSchema,
  communitySteamProfileSchema,
} from "./guards";
import { getOptionalServerEnv, getRequiredServerEnv } from "@/lib/env";
import logger from "@/lib/logger";

const STEAM_API_BASE = "https://api.steampowered.com";
const STEAM64_OFFSET = BigInt("76561197960265728");
const PLAYER_IDENTITY_REVALIDATE_SECONDS = 604800;

interface SteamFetchOptions {
  revalidate: number;
  tags?: string[];
}

function getSteamApiKey(): string {
  return getRequiredServerEnv("STEAM_API_KEY");
}

// ---- ID Conversion ----

export function steam64ToAccountId(steam64: string): number {
  return Number(BigInt(steam64) - STEAM64_OFFSET);
}

export function accountIdToSteam64(accountId: number): string {
  return String(BigInt(accountId) + STEAM64_OFFSET);
}

export function getPlayerIdentityTag(accountId: number): string {
  return `player:${accountId}`;
}

export function isValidSteam64(id: string): boolean {
  return /^\d{17}$/.test(id) && BigInt(id) >= STEAM64_OFFSET;
}

// ---- Fetch Wrapper ----

const MAX_RETRIES = 2;

async function steamFetch(url: string, options: SteamFetchOptions): Promise<Response> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, {
        next: { revalidate: options.revalidate, tags: options.tags },
        signal: AbortSignal.timeout(10_000),
      });
    } catch (err) {
      if (err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError")) {
        if (attempt < MAX_RETRIES) {
          const delay = 500 * (attempt + 1);
          logger.warn({ url: url.replace(/key=[^&]+/, "key=***"), attempt, delay }, "Steam API timeout, retrying");
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        logger.error({ url: url.replace(/key=[^&]+/, "key=***") }, "Steam API timeout");
        throw new ApiError("Request timeout", 408, url);
      }
      throw err;
    }

    if ((res.status === 429 || res.status === 503) && attempt < MAX_RETRIES) {
      const retryAfter = res.headers.get("Retry-After");
      const delay = retryAfter ? Math.min(parseInt(retryAfter, 10) * 1000, 5000) : 1000 * (attempt + 1);
      logger.warn({ url: url.replace(/key=[^&]+/, "key=***"), status: res.status, attempt, delay }, "Steam API rate limited, retrying");
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }

    return res;
  }

  throw new ApiError("Max retries exceeded", 429, url);
}

// ---- API Functions ----

export async function resolveVanityURL(
  vanityName: string,
): Promise<string | null> {
  if (!getOptionalServerEnv("STEAM_API_KEY")) return null;
  const key = getSteamApiKey();
  const url = `${STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v1/?key=${key}&vanityurl=${encodeURIComponent(vanityName)}`;

  const res = await steamFetch(url, { revalidate: 31536000 });

  if (!res.ok) {
    logger.error({ endpoint: "ResolveVanityURL", status: res.status, vanityName }, "Steam API error");
    throw new ApiError(
      `Steam API error: ${res.statusText}`,
      res.status,
      "ResolveVanityURL",
    );
  }

  const data = parseExternalData<SteamResolveVanityResponse>(
    steamResolveVanityResponseSchema,
    await res.json(),
    "Steam ResolveVanityURL",
  );

  if (data.response.success !== 1) {
    logger.info({ vanityName }, "Vanity URL not found");
    return null;
  }

  logger.info({ vanityName, steamId: data.response.steamid }, "Vanity URL resolved");
  return data.response.steamid ?? null;
}

export async function getPlayerSummaries(
  steamIds: string[],
): Promise<SteamPlayerSummary[]> {
  if (steamIds.length === 0) return [];
  if (steamIds.length > 100) {
    throw new Error("Steam API supports at most 100 Steam IDs per request");
  }

  if (!getOptionalServerEnv("STEAM_API_KEY")) {
    return getCommunityPlayerSummaries(steamIds.map(steam64ToAccountId).sort((a, b) => a - b));
  }

  const key = getSteamApiKey();
  const ids = steamIds.join(",");
  const url = `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/?key=${key}&steamids=${ids}`;

  const tags = steamIds.length === 1
    ? [getPlayerIdentityTag(steam64ToAccountId(steamIds[0]))]
    : undefined;
  const revalidate = steamIds.length === 1 ? PLAYER_IDENTITY_REVALIDATE_SECONDS : 604800;
  const res = await steamFetch(url, { revalidate, tags });

  if (!res.ok) {
    logger.error({ endpoint: "GetPlayerSummaries", status: res.status }, "Steam API error");
    throw new ApiError(
      `Steam API error: ${res.statusText}`,
      res.status,
      "GetPlayerSummaries",
    );
  }

  const data = parseExternalData<SteamPlayerSummariesResponse>(
    steamPlayerSummariesResponseSchema,
    await res.json(),
    "Steam GetPlayerSummaries",
  );
  return data.response.players;
}

export async function getPlayerSummary(
  steamId: string,
): Promise<SteamPlayerSummary | null> {
  const players = await getPlayerSummaries([steamId]);
  return players[0] ?? null;
}

async function fetchCommunityProfiles(url: string): Promise<SteamPlayerSummary[]> {
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
  if (response.status === 404) return [];
  if (!response.ok) throw new ApiError("Community profile lookup unavailable", response.status, url);
  const profiles = parseExternalData(communitySteamProfileSchema.array(), await response.json(), "Community Steam profiles");
  return profiles.map(({ account_id, ...profile }) => ({ ...profile, steamid: accountIdToSteam64(account_id) }));
}

// Cache only identity fields, not the upstream friends/match arrays.
const getCommunityPlayerSummaries = unstable_cache(
  async (accountIds: number[]) => fetchCommunityProfiles(`https://api.deadlock-api.com/v1/players/steam?account_ids=${accountIds.join(",")}`),
  ["community-player-identities-v1"], { revalidate: 86400 },
);

export async function searchCommunityProfiles(query: string): Promise<SteamPlayerSummary[]> {
  if (query.length < 3) return [];
  const params = new URLSearchParams({ search_query: query, limit: "15", min_matches_played_last_30d: "0" });
  return fetchCommunityProfiles(`https://api.deadlock-api.com/v1/players/steam-search?${params}`);
}
