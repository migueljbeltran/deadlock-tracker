import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SigilBackground } from "@/components/layout/SigilBackground";
import { PlayerSearchBar } from "@/components/search/PlayerSearchBar";
import PlayerContent from "@/components/player/PlayerContent";
import { getHeroes, getRanks, type PlayerSnapshotResponse } from "@/lib/api";
import { getLatestGlobalPlayerMetricsBenchmark } from "@/lib/playerBenchmark";
import { getPlayerSnapshotState } from "@/lib/playerSnapshot";

// DO NOT convert to ISR. Player URLs are a long-tail of unique account IDs —
// ISR would generate a CDN write per unique visit ($$$). Redis snapshot system
// in lib/playerSnapshot.ts already provides 24h freshness / 7-day TTL. See
// commit c838155 and the ISR-Write spike on 2026-04-09 for prior incidents.
export const dynamic = 'force-dynamic';

interface PlayerPageProps {
  params: Promise<{ accountId: string }>;
}

function isValidAccountId(id: string): boolean {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 && n < 2_147_483_647;
}

export async function generateMetadata(
  { params }: PlayerPageProps,
): Promise<Metadata> {
  const { accountId: raw } = await params;

  if (!isValidAccountId(raw)) {
    return { title: "Player Not Found", robots: { index: false } };
  }

  return {
    title: `Player ${raw} — Deadlock Player Stats`,
    description: `Deadlock stats, match history, and hero performance for player ${raw}. View win rates, recent matches, and top heroes.`,
    alternates: {
      canonical: `/player/${raw}`,
    },
    openGraph: {
      title: `Player ${raw} — Deadlock Player Stats`,
      description: `Deadlock stats and match history for player ${raw}.`,
      url: `/player/${raw}`,
    },
    robots: { index: false },
  };
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { accountId: raw } = await params;

  if (!isValidAccountId(raw)) {
    notFound();
  }

  const accountId = Number(raw);

  // Server-side existence gate so a missing player returns a real HTTP 404 (not a
  // 200 + client-side "not found" UI, which Google flags as Soft 404).
  // getPlayerSnapshotState is Redis-cached and returns { snapshot: null } on
  // upstream failures — it does not throw — so this is safe to call directly.
  const [heroes, ranks, playerState, benchmark] = await Promise.all([
    getHeroes(),
    getRanks(),
    getPlayerSnapshotState(accountId),
    getLatestGlobalPlayerMetricsBenchmark(),
  ]);

  if (!playerState.snapshot) {
    notFound();
  }

  const initialData: PlayerSnapshotResponse = {
    success: true,
    snapshot: playerState.snapshot,
    benchmark,
    isStale: playerState.isStale,
    shouldRefresh: playerState.shouldRefresh,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="atmosphere-soul relative flex-1">
        <SigilBackground intensity="subtle" />

        {/* Inline search — find another player without going home */}
        <div className="relative z-20 mx-auto max-w-3xl px-4 pt-6 sm:px-6 lg:px-8">
          <PlayerSearchBar />
        </div>

        <PlayerContent
          accountId={accountId}
          heroes={heroes}
          ranks={ranks}
          initialData={initialData}
        />
      </main>

      <Footer />
    </div>
  );
}
