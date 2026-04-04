import { NextRequest, NextResponse } from "next/server";
import type { PlayerSnapshotResponse } from "@/lib/api";
import { getLatestGlobalPlayerMetricsBenchmark } from "@/lib/playerBenchmark";
import { getPlayerSnapshotState } from "@/lib/playerSnapshot";

function isValidAccountId(id: string): boolean {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 && n < 2_147_483_647;
}

interface PlayerRouteProps {
  params: Promise<{ accountId: string }>;
}

export async function GET(_request: NextRequest, { params }: PlayerRouteProps) {
  const { accountId: raw } = await params;

  if (!isValidAccountId(raw)) {
    const body: PlayerSnapshotResponse = { success: false, error: "Invalid account ID", notFound: true };
    return NextResponse.json(body, {
      status: 404,
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  }

  const [playerState, benchmark] = await Promise.all([
    getPlayerSnapshotState(Number(raw)),
    getLatestGlobalPlayerMetricsBenchmark(),
  ]);
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
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}
