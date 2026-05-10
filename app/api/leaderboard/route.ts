import { NextRequest, NextResponse } from "next/server";
import type { DeadlockRegion } from "@/lib/api";
import { getResolvedLeaderboardSnapshot } from "@/lib/leaderboardSnapshot";
import { checkRequestRateLimit, rateLimitResponse } from "@/lib/ratelimit";
import { regionSchema } from "@/lib/validations";
import logger from "@/lib/logger";

export async function GET(request: NextRequest) {
  const { success: allowed, reset } = await checkRequestRateLimit(request, "leaderboardApi");
  if (!allowed) return rateLimitResponse(reset);

  const parsed = regionSchema.safeParse(request.nextUrl.searchParams.get("region") ?? "NAmerica");
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid region" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const validRegion: DeadlockRegion = parsed.data;
  const rawPage = Number(request.nextUrl.searchParams.get("page"));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  let snapshot: Awaited<ReturnType<typeof getResolvedLeaderboardSnapshot>>;
  try {
    snapshot = await getResolvedLeaderboardSnapshot(validRegion, {
      page,
      enrichProfileLinks: true,
    });
  } catch (error) {
    logger.warn({ region: validRegion, error }, "Leaderboard snapshot unavailable");
    return NextResponse.json(
      { success: false, error: "Leaderboard data is still refreshing. Please try again shortly." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
