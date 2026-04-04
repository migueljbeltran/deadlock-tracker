export const revalidate = 604800; // ISR: cache leaderboard for 7 days (Refresh button handles on-demand updates)

import { Suspense } from "react";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SigilBackground } from "@/components/layout/SigilBackground";
import LeaderboardContent from "@/components/leaderboard/LeaderboardContent";
import { LeaderboardTableSkeleton } from "@/components/leaderboard/LeaderboardTableSkeleton";
import { getHeroes, getRanks } from "@/lib/api";

export const metadata: Metadata = {
  title: "Deadlock Ranked Leaderboard — Top Players by Region",
  description:
    "View the Deadlock ranked leaderboard. See top players across North America, Europe, Asia, South America, and Oceania with ranks, badges, and top heroes.",
  alternates: {
    canonical: "/leaderboard",
  },
  openGraph: {
    title: "Deadlock Ranked Leaderboard",
    description:
      "Top Deadlock players across all regions. View ranks, badges, and top heroes.",
    url: "/leaderboard",
  },
};

export default async function LeaderboardPage() {
  const [ranks, heroes] = await Promise.all([getRanks(), getHeroes()]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="relative flex-1">
        <SigilBackground intensity="subtle" />

        <div className="atmosphere-amber relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <Suspense fallback={<LeaderboardTableSkeleton />}>
            <LeaderboardContent ranks={ranks} heroes={heroes} />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
