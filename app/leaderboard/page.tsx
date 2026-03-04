import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SigilBackground } from "@/components/layout/SigilBackground";
import { RegionSelector } from "@/components/leaderboard/RegionSelector";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { Pagination } from "@/components/ui/Pagination";
import {
  getLeaderboard,
  getRanks,
  getHeroes,
} from "@/lib/api";
import type { DeadlockRegion } from "@/lib/api";

const VALID_REGIONS: DeadlockRegion[] = [
  "NAmerica",
  "SAmerica",
  "Europe",
  "Asia",
  "Oceania",
];

export const metadata: Metadata = {
  title: "Leaderboard | dltracker",
  description: "Deadlock ranked leaderboard across all regions.",
};

const PAGE_SIZE = 100;

interface LeaderboardPageProps {
  searchParams: Promise<{ region?: string; page?: string }>;
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
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

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="relative flex-1">
        <SigilBackground intensity="subtle" />

        <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-3xl text-amber sm:text-4xl">
                Leaderboard
              </h1>
              <p className="mt-2 text-text-secondary">
                The ranked archives — top souls by region.
              </p>
            </div>
            <RegionSelector currentRegion={region} />
          </div>

          <div key={`leaderboard-${region}-page-${page}`}>
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
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
