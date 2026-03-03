import { NextRequest, NextResponse } from "next/server";
import {
  isValidSteam64,
  resolveVanityURL,
  getPlayerSummary,
  steam64ToAccountId,
} from "@/lib/api";

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
  const rawQuery = request.nextUrl.searchParams.get("q");

  if (!rawQuery || rawQuery.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: "Search query is required" },
      { status: 400 },
    );
  }

  const query = extractQuery(rawQuery);

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

    return NextResponse.json({
      success: true,
      player: {
        accountId: steam64ToAccountId(player.steamid),
        name: player.personaname,
        avatar: player.avatarfull,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to search. Please try again." },
      { status: 500 },
    );
  }
}
