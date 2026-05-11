"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { RegionSelector } from "@/components/leaderboard/RegionSelector";
import { Pagination } from "@/components/ui/Pagination";
import { DataFreshness } from "@/components/ui/DataFreshness";
import { LeaderboardTableSkeleton } from "@/components/leaderboard/LeaderboardTableSkeleton";
import { useLeaderboardSnapshot, type LeaderboardSnapshot } from "@/lib/hooks/useLeaderboardSnapshot";
import type { DeadlockRegion, DeadlockHero, DeadlockRank } from "@/lib/api";

const PAGE_SIZE = 50;
const VALID_REGIONS: DeadlockRegion[] = ["NAmerica", "SAmerica", "Europe", "Asia", "Oceania"];

interface LeaderboardContentProps {
  heroes: DeadlockHero[];
  ranks: DeadlockRank[];
  initialRegion: DeadlockRegion;
  initialSnapshot: LeaderboardSnapshot | null;
}

export default function LeaderboardContent({
  heroes,
  ranks,
  initialRegion,
  initialSnapshot,
}: LeaderboardContentProps) {
  const searchParams = useSearchParams();
  const regionParam = searchParams.get("region") ?? "NAmerica";
  const region: DeadlockRegion = VALID_REGIONS.includes(regionParam as DeadlockRegion)
    ? (regionParam as DeadlockRegion)
    : "NAmerica";
  const rawPage = Number(searchParams.get("page"));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  const { snapshot, isLoading, hasError } = useLeaderboardSnapshot(region, page, {
    initialRegion,
    initialSnapshot,
  });

  const rankMap = useMemo(() => new Map(ranks.map((r) => [r.tier, r])), [ranks]);
  const heroMap = useMemo(() => new Map(heroes.map((h) => [h.id, h])), [heroes]);

  const entries = snapshot?.entries ?? [];
  const offset = (page - 1) * PAGE_SIZE;
  const pageEntries = entries.slice(offset, offset + PAGE_SIZE);
  const hasNextPage = entries.length > offset + PAGE_SIZE;

  return (
    <>
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl bg-clip-text text-transparent bg-gradient-to-b from-amber-light via-amber to-amber/70">
              Leaderboard
            </h1>
            <p className="mt-2 text-text-secondary">
              Top ranked players in Deadlock across all regions.
            </p>
            {snapshot && (
              <div className="mt-3">
                <DataFreshness fetchedAt={snapshot.fetchedAt} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <RegionSelector currentRegion={region} />
          </div>
        </div>
      </div>

      {isLoading ? (
        <LeaderboardTableSkeleton />
      ) : hasError ? (
        <div className="py-16 text-center text-text-secondary">
          Failed to load leaderboard data. Please try again later.
        </div>
      ) : (
        <>
          <LeaderboardTable
            entries={pageEntries}
            rankMap={rankMap}
            heroMap={heroMap}
          />

          <Pagination
            currentPage={page}
            hasNextPage={hasNextPage}
            baseUrl="/leaderboard"
            extraParams={{ region }}
          />
        </>
      )}
    </>
  );
}
