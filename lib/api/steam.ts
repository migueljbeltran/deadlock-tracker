import "server-only";

import type {
  SteamResolveVanityResponse,
  SteamPlayerSummariesResponse,
  SteamPlayerSummary,
} from "./types";
import { ApiError } from "./types";
import logger from "@/lib/logger";
import { cacheGet, cacheSet } from "@/lib/cache";

const STEAM_API_BASE = "https://api.steampowered.com";
const STEAM64_OFFSET = BigInt("76561197960265728");

function getSteamApiKey(): string {
  const key = process.env.STEAM_API_KEY;
  if (!key) {
    throw new Error("STEAM_API_KEY environment variable is not set.");
  }
  return key;
}

// ---- ID Conversion ----

export function steam64ToAccountId(steam64: string): number {
  return Number(BigInt(steam64) - STEAM64_OFFSET);
}

export function accountIdToSteam64(accountId: number): string {
  return String(BigInt(accountId) + STEAM64_OFFSET);
}

export function isValidSteam64(id: string): boolean {
  return /^\d{17}$/.test(id) && BigInt(id) >= STEAM64_OFFSET;
}

// ---- API Functions ----

export async function resolveVanityURL(
  vanityName: string,
): Promise<string | null> {
  const cacheKey = `vanity:${vanityName.toLowerCase()}`;
  const cached = await cacheGet<string | "NOT_FOUND">(cacheKey);
  if (cached === "NOT_FOUND") return null;
  if (cached) return cached;

  const key = getSteamApiKey();
  const url = `${STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v1/?key=${key}&vanityurl=${encodeURIComponent(vanityName)}`;

  const res = await fetch(url, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(10_000) });

  if (!res.ok) {
    logger.error({ endpoint: "ResolveVanityURL", status: res.status, vanityName }, "Steam API error");
    throw new ApiError(
      `Steam API error: ${res.statusText}`,
      res.status,
      "ResolveVanityURL",
    );
  }

  const data: SteamResolveVanityResponse = await res.json();

  if (data.response.success !== 1) {
    logger.info({ vanityName }, "Vanity URL not found");
    await cacheSet(cacheKey, "NOT_FOUND", 86400);
    return null;
  }

  logger.info({ vanityName, steamId: data.response.steamid }, "Vanity URL resolved");
  const steamId = data.response.steamid ?? null;
  if (steamId) await cacheSet(cacheKey, steamId, 86400);
  return steamId;
}

export async function getPlayerSummaries(
  steamIds: string[],
): Promise<SteamPlayerSummary[]> {
  if (steamIds.length === 0) return [];
  if (steamIds.length > 100) {
    throw new Error("Steam API supports at most 100 Steam IDs per request");
  }

  // Check Redis for individually cached profiles, only fetch missing ones
  const cachedPlayers: SteamPlayerSummary[] = [];
  const missingIds: string[] = [];

  for (const id of steamIds) {
    const cached = await cacheGet<SteamPlayerSummary>(`steam:${id}`);
    if (cached) {
      cachedPlayers.push(cached);
    } else {
      missingIds.push(id);
    }
  }

  if (missingIds.length === 0) return cachedPlayers;

  const key = getSteamApiKey();
  const ids = missingIds.join(",");
  const url = `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/?key=${key}&steamids=${ids}`;

  const res = await fetch(url, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(10_000) });

  if (!res.ok) {
    logger.error({ endpoint: "GetPlayerSummaries", status: res.status }, "Steam API error");
    throw new ApiError(
      `Steam API error: ${res.statusText}`,
      res.status,
      "GetPlayerSummaries",
    );
  }

  const data: SteamPlayerSummariesResponse = await res.json();

  // Cache each player individually
  for (const player of data.response.players) {
    await cacheSet(`steam:${player.steamid}`, player, 7200);
  }

  return [...cachedPlayers, ...data.response.players];
}

export async function getPlayerSummary(
  steamId: string,
): Promise<SteamPlayerSummary | null> {
  const players = await getPlayerSummaries([steamId]);
  return players[0] ?? null;
}
