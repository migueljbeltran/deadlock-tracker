import { NextRequest, NextResponse } from "next/server";
import type { DeadlockRegion } from "@/lib/api";
import { getResolvedLeaderboardSnapshot } from "@/lib/leaderboardSnapshot";

const VALID_REGIONS: DeadlockRegion[] = ["NAmerica", "SAmerica", "Europe", "Asia", "Oceania"];

export async function GET(request: NextRequest) {
  const region = request.nextUrl.searchParams.get("region") ?? "NAmerica";
  const validRegion: DeadlockRegion = VALID_REGIONS.includes(region as DeadlockRegion)
    ? (region as DeadlockRegion)
    : "NAmerica";

  const snapshot = await getResolvedLeaderboardSnapshot(validRegion);
  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
