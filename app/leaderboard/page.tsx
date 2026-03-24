export const revalidate = 120; // ISR: cache leaderboard for 2 minutes

import { Suspense } from "react";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SigilBackground } from "@/components/layout/SigilBackground";
import LeaderboardContent from "@/components/leaderboard/LeaderboardContent";
import { LeaderboardTableSkeleton } from "@/components/leaderboard/LeaderboardTableSkeleton";

export const metadata: Metadata = {
  title: "Leaderboard | dltracker",
  description: "Deadlock ranked leaderboard across all regions.",
};

interface LeaderboardPageProps {
  searchParams: Promise<{ region?: string; page?: string }>;
}

export default function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="relative flex-1">
        <SigilBackground intensity="subtle" />

        <div className="atmosphere-amber relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <Suspense fallback={<LeaderboardTableSkeleton />}>
            <LeaderboardContent searchParams={searchParams} />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
