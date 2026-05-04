import { NextRequest, NextResponse } from "next/server";
import type { PlayerSnapshotResponse } from "@/lib/api";
import logger from "@/lib/logger";
import { getLatestGlobalPlayerMetricsBenchmark } from "@/lib/playerBenchmark";
import { getPlayerSnapshotState } from "@/lib/playerSnapshot";
import { checkRequestRateLimit, rateLimitResponse } from "@/lib/ratelimit";
import { accountIdSchema } from "@/lib/validations";

interface PlayerRouteProps {
  params: Promise<{ accountId: string }>;
}

export async function GET(_request: NextRequest, { params }: PlayerRouteProps) {
  const { success: allowed, reset } = await checkRequestRateLimit(_request, "playerApi");
  if (!allowed) return rateLimitResponse(reset);

  const { accountId: raw } = await params;
  const parsed = accountIdSchema.safeParse(raw);

  if (!parsed.success) {
    const body: PlayerSnapshotResponse = { success: false, error: "Invalid account ID" };
    return NextResponse.json(body, {
      status: 400,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const accountId = parsed.data;

  let playerState: Awaited<ReturnType<typeof getPlayerSnapshotState>>;
  let benchmark: Awaited<ReturnType<typeof getLatestGlobalPlayerMetricsBenchmark>>;
  try {
    [playerState, benchmark] = await Promise.all([
      getPlayerSnapshotState(accountId),
      getLatestGlobalPlayerMetricsBenchmark(),
    ]);
  } catch (error) {
    logger.error({ accountId, error }, "Player snapshot route failed unexpectedly");
    const body: PlayerSnapshotResponse = { success: false, error: "Temporarily unavailable" };
    return NextResponse.json(body, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
  const { snapshot, isStale, shouldRefresh } = playerState;

  if (!snapshot) {
    const body: PlayerSnapshotResponse = { success: false, error: "Player not found", notFound: true };
    return NextResponse.json(body, {
      status: 404,
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  }

  const body: PlayerSnapshotResponse = {
    success: true,
    snapshot,
    benchmark,
    isStale,
    shouldRefresh,
  };

  return NextResponse.json(body, {
    headers: {
      // Redis snapshot handles data freshness — CDN can serve this for 30 min safely
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
    },
  });
}
