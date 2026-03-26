import { NextRequest, NextResponse } from "next/server";
import {
  isValidSteam64,
  resolveVanityURL,
  getPlayerSummary,
  steam64ToAccountId,
  accountIdToSteam64,
  searchLeaderboardByName,
  resolveAccountIds,
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
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "127.0.0.1";
  const { success: allowed, reset } = await checkRateLimit(ip);

  if (!allowed) {
    logger.warn({ ip }, "Rate limit exceeded");
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: reset ? { "Retry-After": String(Math.max(1, Math.ceil((reset - Date.now()) / 1000))) } : {},
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
    // For direct Steam64 IDs, skip leaderboard search entirely
    if (isValidSteam64(query)) {
      const player = await getPlayerSummary(query);

      if (player) {
        const accountId = steam64ToAccountId(player.steamid);
        logger.info({ query, accountId }, "Search success (steam64)");
        return NextResponse.json({
          success: true,
          results: [{
            source: "steam" as const,
            accountId,
            name: player.personaname,
            avatar: player.avatarfull,
          }],
        });
      }

      return NextResponse.json(
        { success: false, error: "No player found for that Steam ID." },
        { status: 404 },
      );
    }

    // For Deadlock Account IDs (numeric, not 17 digits), convert to Steam64
    if (/^\d+$/.test(query) && query.length < 17) {
      const accountId = parseInt(query, 10);
      if (accountId > 0) {
        const steam64 = accountIdToSteam64(accountId);
        const player = await getPlayerSummary(steam64);

        if (player) {
          logger.info({ query, accountId }, "Search success (account_id)");
          return NextResponse.json({
            success: true,
            results: [{
              source: "steam" as const,
              accountId,
              name: player.personaname,
              avatar: player.avatarfull,
            }],
          });
        }
      }
    }

    // Run vanity URL + leaderboard search in parallel for name queries
    const [vanityResult, leaderboardResults] = await Promise.all([
      resolveVanityURL(query).catch(() => null),
      searchLeaderboardByName(query),
    ]);

    const results: Array<Record<string, unknown>> = [];

    // Add Steam vanity match first (if found)
    if (vanityResult) {
      const player = await getPlayerSummary(vanityResult);
      if (player) {
        const accountId = steam64ToAccountId(player.steamid);
        results.push({
          source: "steam",
          accountId,
          name: player.personaname,
          avatar: player.avatarfull,
        });
      }
    }

    // Resolve ambiguous leaderboard entries using 3-signal scoring
    // (name match + hero overlap + match count) — same algorithm the
    // leaderboard page uses. Falls back to first candidate on failure.
    const resolvableEntries = leaderboardResults.map((m) => ({
      account_name: m.accountName,
      possible_account_ids: m.possibleAccountIds,
      top_hero_ids: m.topHeroIds,
    }));

    const resolvedMap = resolvableEntries.length > 0
      ? await resolveAccountIds(resolvableEntries).catch(() => new Map<number, { accountId: number }>())
      : new Map<number, { accountId: number }>();

    const steamAccountId = results.length > 0 ? results[0].accountId : null;
    for (let i = 0; i < leaderboardResults.length; i++) {
      const m = leaderboardResults[i];
      const resolved = resolvedMap.get(i);
      const accountId = resolved ? resolved.accountId : m.accountId;
      if (accountId === steamAccountId) continue;
      results.push({
        source: "leaderboard",
        accountId,
        accountName: m.accountName,
        rank: m.rank,
        rankedRank: m.rankedRank,
        rankedSubrank: m.rankedSubrank,
        topHeroIds: m.topHeroIds,
        region: m.region,
      });
    }

    if (results.length > 0) {
      logger.info({ query, count: results.length }, "Search success");
      return NextResponse.json({ success: true, results });
    }

    return NextResponse.json(
      { success: false, error: "No player found. Try a Steam ID, profile URL, or in-game name." },
      { status: 404 },
    );
  } catch (err) {
    logger.error({ query, error: err instanceof Error ? err.message : "Unknown" }, "Search failed");
    return NextResponse.json(
      { success: false, error: "Failed to search. Please try again." },
      { status: 500 },
    );
  }
}
