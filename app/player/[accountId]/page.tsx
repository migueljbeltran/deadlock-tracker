export const revalidate = 1800; // ISR: cache player profile for 30 minutes

import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SigilBackground } from "@/components/layout/SigilBackground";
import { SigilLoader } from "@/components/ui/SigilLoader";
import { PlayerSearchBar } from "@/components/search/PlayerSearchBar";
import PlayerContent from "@/components/player/PlayerContent";
import { accountIdToSteam64, getPlayerSummary } from "@/lib/api";

interface PlayerPageProps {
  params: Promise<{ accountId: string }>;
  searchParams: Promise<{ page?: string }>;
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

  const steam64 = accountIdToSteam64(Number(raw));
  const player = await getPlayerSummary(steam64);

  if (!player) {
    return { title: "Player Not Found", robots: { index: false } };
  }

  return {
    title: `${player.personaname} — Deadlock Player Stats`,
    description: `Deadlock stats, match history, and hero performance for ${player.personaname}. View win rates, recent matches, and top heroes.`,
    alternates: {
      canonical: `/player/${raw}`,
    },
    openGraph: {
      title: `${player.personaname} — Deadlock Player Stats`,
      description: `Deadlock stats and match history for ${player.personaname}.`,
      url: `/player/${raw}`,
      images: player.avatarfull
        ? [{ url: player.avatarfull, alt: player.personaname }]
        : undefined,
    },
  };
}

export default async function PlayerPage({ params, searchParams }: PlayerPageProps) {
  const { accountId: raw } = await params;

  if (!isValidAccountId(raw)) {
    notFound();
  }

  const accountId = Number(raw);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="atmosphere-soul relative flex-1">
        <SigilBackground intensity="subtle" />

        {/* Inline search — find another player without going home */}
        <div className="relative z-20 mx-auto max-w-3xl px-4 pt-6 sm:px-6 lg:px-8">
          <PlayerSearchBar />
        </div>

        <Suspense
          fallback={
            <div className="relative z-10 flex items-center justify-center py-32">
              <div className="glass-panel rounded-xl px-10 py-8 flex flex-col items-center gap-4 shadow-[var(--glow-soul-ambient)]">
                <SigilLoader size="lg" />
                <p className="font-heading text-text-secondary">
                  Summoning soul records...
                </p>
              </div>
            </div>
          }
        >
          <PlayerContent accountId={accountId} searchParams={searchParams} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
