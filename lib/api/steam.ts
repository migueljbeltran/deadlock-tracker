import "server-only";

import type {
  SteamResolveVanityResponse,
  SteamPlayerSummariesResponse,
  SteamPlayerSummary,
} from "./types";
import { ApiError } from "./types";

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
  return /^\d{17}$/.test(id) && id.startsWith("7656119");
}

// ---- API Functions ----

export async function resolveVanityURL(
  vanityName: string,
): Promise<string | null> {
  const key = getSteamApiKey();
  const url = `${STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v1/?key=${key}&vanityurl=${encodeURIComponent(vanityName)}`;

  const res = await fetch(url, { next: { revalidate: 3600 } });

  if (!res.ok) {
    throw new ApiError(
      `Steam API error: ${res.statusText}`,
      res.status,
      "ResolveVanityURL",
    );
  }

  const data: SteamResolveVanityResponse = await res.json();

  if (data.response.success !== 1) {
    return null;
  }

  return data.response.steamid ?? null;
}

export async function getPlayerSummaries(
  steamIds: string[],
): Promise<SteamPlayerSummary[]> {
  if (steamIds.length === 0) return [];
  if (steamIds.length > 100) {
    throw new Error("Steam API supports at most 100 Steam IDs per request");
  }

  const key = getSteamApiKey();
  const ids = steamIds.join(",");
  const url = `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/?key=${key}&steamids=${ids}`;

  const res = await fetch(url, { next: { revalidate: 300 } });

  if (!res.ok) {
    throw new ApiError(
      `Steam API error: ${res.statusText}`,
      res.status,
      "GetPlayerSummaries",
    );
  }

  const data: SteamPlayerSummariesResponse = await res.json();
  return data.response.players;
}

export async function getPlayerSummary(
  steamId: string,
): Promise<SteamPlayerSummary | null> {
  const players = await getPlayerSummaries([steamId]);
  return players[0] ?? null;
}
