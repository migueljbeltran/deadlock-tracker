import { NextRequest, NextResponse } from "next/server";
import {
  isValidSteam64,
  resolveVanityURL,
  getPlayerSummary,
  steam64ToAccountId,
  accountIdToSteam64,
  resolveAccountIds,
} from "@/lib/api";
import { cacheGet, cacheSet } from "@/lib/cache";
import { searchLeaderboardByNameCached } from "@/lib/leaderboardSearch";
import { searchQuerySchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/ratelimit";
import logger from "@/lib/logger";

const SEARCH_CACHE_TTL_SECONDS = 86400; // 24 hours — prefer cache hits over repeated search fan-out
const MAX_RESOLVED_AMBIGUOUS_RESULTS = 5;

type SearchResponseBody =
  | { success: true; results: Array<Record<string, unknown>> }
  | { success: false; error: string };

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
  const normalizedQuery = query.toLowerCase();

  if (query.length === 0) {
    return NextResponse.json(
      { success: false, error: "Invalid search query" },
      { status: 400 },
    );
  }

  try {
    const cacheKey = `search:${normalizedQuery}`;
    const cached = await cacheGet<SearchResponseBody>(cacheKey);
    if (cached) {
      logger.info({ query: normalizedQuery }, "Search cache hit");
      return NextResponse.json(cached, { status: cached.success ? 200 : 404 });
    }

    // For direct Steam64 IDs, skip leaderboard search entirely
    if (isValidSteam64(query)) {
      const player = await getPlayerSummary(query);

      if (player) {
        const accountId = steam64ToAccountId(player.steamid);
        logger.info({ query, accountId }, "Search success (steam64)");
        const body: SearchResponseBody = {
          success: true,
          results: [{
            source: "steam" as const,
            accountId,
            name: player.personaname,
            avatar: player.avatarfull,
          }],
        };
        await cacheSet(cacheKey, body, SEARCH_CACHE_TTL_SECONDS);
        return NextResponse.json(body);
      }

      const body: SearchResponseBody = { success: false, error: "No player found for that Steam ID." };
      await cacheSet(cacheKey, body, SEARCH_CACHE_TTL_SECONDS);
      return NextResponse.json(body, { status: 404 });
    }

    // For Deadlock Account IDs (numeric, not 17 digits), convert to Steam64
    if (/^\d+$/.test(query) && query.length < 17) {
      const accountId = parseInt(query, 10);
      if (accountId > 0) {
        const steam64 = accountIdToSteam64(accountId);
        const player = await getPlayerSummary(steam64);

        if (player) {
          logger.info({ query, accountId }, "Search success (account_id)");
          const body: SearchResponseBody = {
            success: true,
            results: [{
              source: "steam" as const,
              accountId,
              name: player.personaname,
              avatar: player.avatarfull,
            }],
          };
          await cacheSet(cacheKey, body, SEARCH_CACHE_TTL_SECONDS);
          return NextResponse.json(body);
        }
      }
    }

    const [vanityResult, leaderboardResults] = await Promise.all([
      resolveVanityURL(query).catch(() => null),
      searchLeaderboardByNameCached(query),
    ]);

    const results: Array<Record<string, unknown>> = [];
    let ranLeaderboardSearch = false;
    let ranResolution = false;
    let steamAccountId: number | null = null;

    if (vanityResult) {
      const player = await getPlayerSummary(vanityResult);
      if (player) {
        steamAccountId = steam64ToAccountId(player.steamid);
        results.push({
          source: "steam",
          accountId: steamAccountId,
          name: player.personaname,
          avatar: player.avatarfull,
        });
      }
    }

    if (query.length >= 3) {
      ranLeaderboardSearch = true;
      const ambiguousMatches = leaderboardResults
        .map((m, index) => ({ match: m, index }))
        .filter(({ match }) => match.possibleAccountIds.length > 1)
        .slice(0, MAX_RESOLVED_AMBIGUOUS_RESULTS);

      const resolvableEntries = ambiguousMatches.map(({ match }) => ({
          account_name: match.accountName,
          possible_account_ids: match.possibleAccountIds,
          top_hero_ids: match.topHeroIds,
      }));

      const resolvedMap = resolvableEntries.length > 0
        ? await resolveAccountIds(resolvableEntries).catch(() => new Map<number, { accountId: number }>())
        : new Map<number, { accountId: number }>();
      const resolvedByLeaderboardIndex = new Map<number, { accountId: number }>();
      for (let i = 0; i < ambiguousMatches.length; i++) {
        const resolved = resolvedMap.get(i);
        if (resolved) {
          resolvedByLeaderboardIndex.set(ambiguousMatches[i].index, resolved);
        }
      }

      ranResolution = resolvableEntries.length > 0;

      for (let i = 0; i < leaderboardResults.length; i++) {
        const m = leaderboardResults[i];
        const resolved = resolvedByLeaderboardIndex.get(i);
        const accountId = resolved?.accountId ?? m.accountId;
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
    }

    if (results.length > 0) {
      logger.info({
        query: normalizedQuery,
        resultCount: results.length,
        queryType: vanityResult ? "vanity" : "name",
        ranLeaderboardSearch,
        ranResolution,
      }, "Search success");
      const body: SearchResponseBody = { success: true, results };
      await cacheSet(cacheKey, body, SEARCH_CACHE_TTL_SECONDS);
      return NextResponse.json(body);
    }

    logger.info({
      query: normalizedQuery,
      queryType: vanityResult ? "vanity" : "name",
      ranLeaderboardSearch,
      ranResolution,
      resultCount: 0,
    }, "Search miss");
    const body: SearchResponseBody = {
      success: false,
      error: "No player found. Try a Steam ID, profile URL, or in-game name.",
    };
    await cacheSet(cacheKey, body, SEARCH_CACHE_TTL_SECONDS);
    return NextResponse.json(body, { status: 404 });
  } catch (err) {
    logger.error({ query, error: err instanceof Error ? err.message : "Unknown" }, "Search failed");
    return NextResponse.json(
      { success: false, error: "Failed to search. Please try again." },
      { status: 500 },
    );
  }
}
