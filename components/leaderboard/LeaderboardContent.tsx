import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { RegionSelector } from "@/components/leaderboard/RegionSelector";
import { Pagination } from "@/components/ui/Pagination";
import {
  getLeaderboard,
  getRanks,
  getHeroes,
  resolveAccountIds,
} from "@/lib/api";
import type { DeadlockRegion } from "@/lib/api";

const PAGE_SIZE = 100;

const VALID_REGIONS: DeadlockRegion[] = ["NAmerica", "SAmerica", "Europe", "Asia", "Oceania"];

interface LeaderboardContentProps {
  searchParams: Promise<{ region?: string; page?: string }>;
}

export default async function LeaderboardContent({ searchParams }: LeaderboardContentProps) {
  const { region: regionParam, page: pageParam } = await searchParams;

  const region: DeadlockRegion = VALID_REGIONS.includes(regionParam as DeadlockRegion)
    ? (regionParam as DeadlockRegion)
    : "NAmerica";

  const rawPage = Number(pageParam);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  const [entries, ranks, heroes] = await Promise.all([
    getLeaderboard(region),
    getRanks(),
    getHeroes(),
  ]);

  const offset = (page - 1) * PAGE_SIZE;
  const pageEntries = entries.slice(offset, offset + PAGE_SIZE);
  const hasNextPage = entries.length > offset + PAGE_SIZE;

  const rankMap = new Map(ranks.map((r) => [r.tier, r]));
  const heroMap = new Map(heroes.map((h) => [h.id, h]));

  // Resolve ambiguous account IDs by matching Steam names
  const resolvedIds = await resolveAccountIds(pageEntries);

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
          </div>
          <RegionSelector currentRegion={region} />
        </div>
      </div>

      <LeaderboardTable
        entries={pageEntries}
        rankMap={rankMap}
        heroMap={heroMap}
        resolvedAccountIds={resolvedIds}
      />

      <Pagination
        currentPage={page}
        hasNextPage={hasNextPage}
        baseUrl="/leaderboard"
        extraParams={{ region }}
      />
    </>
  );
}
