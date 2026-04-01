import "server-only";

import type {
  SteamResolveVanityResponse,
  SteamPlayerSummariesResponse,
  SteamPlayerSummary,
} from "./types";
import { ApiError } from "./types";
import logger from "@/lib/logger";
import { cacheGet, cacheSet, cacheMget, cacheMset } from "@/lib/cache";

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

// ---- Fetch Wrapper ----

async function steamFetch(url: string, revalidate: number): Promise<Response> {
  try {
    return await fetch(url, { next: { revalidate }, signal: AbortSignal.timeout(10_000) });
  } catch (err) {
    if (err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError")) {
      logger.error({ url: url.replace(/key=[^&]+/, "key=***") }, "Steam API timeout");
      throw new ApiError("Request timeout", 408, url);
    }
    throw err;
  }
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

  const res = await steamFetch(url, 604800);

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
    await cacheSet(cacheKey, "NOT_FOUND", 604800);
    return null;
  }

  logger.info({ vanityName, steamId: data.response.steamid }, "Vanity URL resolved");
  const steamId = data.response.steamid ?? null;
  if (steamId) await cacheSet(cacheKey, steamId, 604800);
  return steamId;
}

export async function getPlayerSummaries(
  steamIds: string[],
): Promise<SteamPlayerSummary[]> {
  if (steamIds.length === 0) return [];
  if (steamIds.length > 100) {
    throw new Error("Steam API supports at most 100 Steam IDs per request");
  }

  // Batch-check Redis for cached profiles in a single round-trip
  const cacheKeys = steamIds.map((id) => `steam:${id}`);
  const cacheResults = await cacheMget<SteamPlayerSummary>(cacheKeys);

  const cachedPlayers: SteamPlayerSummary[] = [];
  const missingIds: string[] = [];

  for (let i = 0; i < steamIds.length; i++) {
    const cached = cacheResults[i];
    if (cached) {
      cachedPlayers.push(cached);
    } else {
      missingIds.push(steamIds[i]);
    }
  }

  if (missingIds.length === 0) return cachedPlayers;

  const key = getSteamApiKey();
  const ids = missingIds.join(",");
  const url = `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/?key=${key}&steamids=${ids}`;

  const res = await steamFetch(url, 604800);

  if (!res.ok) {
    logger.error({ endpoint: "GetPlayerSummaries", status: res.status }, "Steam API error");
    throw new ApiError(
      `Steam API error: ${res.statusText}`,
      res.status,
      "GetPlayerSummaries",
    );
  }

  const data: SteamPlayerSummariesResponse = await res.json();

  // Cache all fetched players in a single Redis pipeline
  await cacheMset(
    data.response.players.map((player) => ({
      key: `steam:${player.steamid}`,
      value: player,
      ttlSeconds: 604800,
    })),
  );

  return [...cachedPlayers, ...data.response.players];
}

export async function getPlayerSummary(
  steamId: string,
): Promise<SteamPlayerSummary | null> {
  const players = await getPlayerSummaries([steamId]);
  return players[0] ?? null;
}
