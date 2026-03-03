import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SigilBackground } from "@/components/layout/SigilBackground";
import { RegionSelector } from "@/components/leaderboard/RegionSelector";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
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

interface LeaderboardPageProps {
  searchParams: Promise<{ region?: string }>;
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const { region: regionParam } = await searchParams;
  const region: DeadlockRegion = VALID_REGIONS.includes(regionParam as DeadlockRegion)
    ? (regionParam as DeadlockRegion)
    : "NAmerica";

  const [entries, ranks, heroes] = await Promise.all([
    getLeaderboard(region),
    getRanks(),
    getHeroes(),
  ]);

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

          <LeaderboardTable
            entries={entries}
            rankMap={rankMap}
            heroMap={heroMap}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
