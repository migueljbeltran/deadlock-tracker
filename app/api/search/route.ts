import { NextRequest, NextResponse } from "next/server";
import {
  isValidSteam64,
  resolveVanityURL,
  getPlayerSummary,
  steam64ToAccountId,
} from "@/lib/api";
import { searchQuerySchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/ratelimit";
import logger from "@/lib/logger";

/**
 * Strip common Steam profile URL patterns to extract the identifier.
 * Handles:
 *   https://steamcommunity.com/id/vanityname
 *   https://steamcommunity.com/profiles/76561198012345678
 *   steamcommunity.com/id/vanityname/
 */
function extractQuery(raw: string): string {
  let q = raw.trim();

  // Strip protocol and domain
  q = q.replace(/^https?:\/\/(www\.)?steamcommunity\.com\//i, "");

  // Strip /id/ or /profiles/ prefix
  q = q.replace(/^(id|profiles)\//i, "");

  // Strip trailing slashes
  q = q.replace(/\/+$/, "");

  return q;
}

export async function GET(request: NextRequest) {
  // Rate limiting
  const ip =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",").pop()?.trim() ??
    "127.0.0.1";
  const { success: allowed, reset } = await checkRateLimit(ip);

  if (!allowed) {
    logger.warn({ ip }, "Rate limit exceeded");
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: reset ? { "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)) } : {},
      },
    );
  }

  // Input validation
  const parsed = searchQuerySchema.safeParse({ q: request.nextUrl.searchParams.get("q") });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid search query";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 },
    );
  }

  const query = extractQuery(parsed.data.q);

  if (query.length === 0) {
    return NextResponse.json(
      { success: false, error: "Invalid search query" },
      { status: 400 },
    );
  }

  try {
    let steamId: string | null = null;

    // Path 1: Direct Steam64 ID
    if (isValidSteam64(query)) {
      steamId = query;
    } else {
      // Path 2: Vanity URL resolution
      steamId = await resolveVanityURL(query);
    }

    if (!steamId) {
      return NextResponse.json(
        { success: false, error: "No player found" },
        { status: 404 },
      );
    }

    const player = await getPlayerSummary(steamId);

    if (!player) {
      return NextResponse.json(
        { success: false, error: "No player found" },
        { status: 404 },
      );
    }

    const accountId = steam64ToAccountId(player.steamid);
    logger.info({ query, accountId }, "Search success");

    return NextResponse.json({
      success: true,
      player: {
        accountId,
        name: player.personaname,
        avatar: player.avatarfull,
      },
    });
  } catch (err) {
    logger.error({ query, error: err instanceof Error ? err.message : "Unknown" }, "Search failed");
    return NextResponse.json(
      { success: false, error: "Failed to search. Please try again." },
      { status: 500 },
    );
  }
}
