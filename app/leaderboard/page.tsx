import { Suspense } from "react";
import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SigilBackground } from "@/components/layout/SigilBackground";
import { RegionSelector } from "@/components/leaderboard/RegionSelector";
import LeaderboardContent from "@/components/leaderboard/LeaderboardContent";
import { LeaderboardTableSkeleton } from "@/components/leaderboard/LeaderboardTableSkeleton";
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
  searchParams: Promise<{ region?: string; page?: string }>;
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const { region: regionParam, page: pageParam } = await searchParams;
  const region: DeadlockRegion = VALID_REGIONS.includes(regionParam as DeadlockRegion)
    ? (regionParam as DeadlockRegion)
    : "NAmerica";

  const rawPage = Number(pageParam);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="relative flex-1">
        <SigilBackground intensity="subtle" />

        <div className="atmosphere-amber relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-3xl text-amber sm:text-4xl flex items-center gap-3">
                <Trophy className="h-7 w-7 text-amber" />
                Leaderboard
              </h1>
              <p className="mt-2 text-text-secondary">
                The ranked archives — top souls by region.
              </p>
            </div>
            <RegionSelector currentRegion={region} />
          </div>

          <Suspense key={`${region}-${page}`} fallback={<LeaderboardTableSkeleton />}>
            <LeaderboardContent region={region} page={page} />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
