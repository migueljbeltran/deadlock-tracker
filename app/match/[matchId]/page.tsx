import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SigilBackground } from "@/components/layout/SigilBackground";
import { ArtDecoDivider } from "@/components/layout/ArtDecoDivider";
import { MatchHeader } from "@/components/match/MatchHeader";
import { TeamScoreboard } from "@/components/match/TeamScoreboard";
import {
  getMatchDetail,
  getMatchPlayerItems,
  getHeroes,
  getItems,
  getRanks,
  getPlayerSummaries,
  accountIdToSteam64,
  steam64ToAccountId,
} from "@/lib/api";
import type { SteamPlayerSummary, DeadlockItem } from "@/lib/api";
import { FadeIn } from "@/components/motion";

export const dynamic = "force-dynamic";

// Return empty array — matches are generated on-demand and then cached via ISR
export async function generateStaticParams() {
  return [];
}

interface MatchDetailPageProps {
  params: Promise<{ matchId: string }>;
}

export async function generateMetadata(
  { params }: MatchDetailPageProps,
): Promise<Metadata> {
  const { matchId } = await params;
  return {
    title: `Match #${matchId} — Deadlock Match Details`,
    description: `Scoreboard, team composition, and player stats for Deadlock match #${matchId}.`,
    robots: { index: false },
    alternates: {
      canonical: `/match/${matchId}`,
    },
  };
}

export default async function MatchDetailPage({ params }: MatchDetailPageProps) {
  const { matchId } = await params;
  const id = Number(matchId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  let match;
  try {
    match = await getMatchDetail(id);
  } catch {
    notFound();
  }

  const players = match.players ?? [];
  if (players.length === 0) notFound();

  // Convert account IDs → Steam64 for the Steam API name lookup
  const steam64Ids = players.map((p) => accountIdToSteam64(p.account_id));
  const [heroes, ranks, steamPlayers, allItems, playerItemsMap] = await Promise.all([
    getHeroes(),
    getRanks(),
    getPlayerSummaries(steam64Ids).catch(() => [] as SteamPlayerSummary[]),
    getItems().catch(() => [] as DeadlockItem[]),
    getMatchPlayerItems(id).catch(() => new Map<number, number[]>()),
  ]);

  const heroMap = new Map(heroes.map((h) => [h.id, h]));

  // Build item lookup (only shopable upgrades)
  const itemMap = new Map<number, DeadlockItem>();
  for (const item of allItems) {
    if (item.shopable) {
      itemMap.set(item.id, item);
    }
  }

  // Map account_id → player name (bridge Steam names to Deadlock IDs)
  const playerNameMap = new Map<number, string>();
  for (const sp of steamPlayers) {
    const steam64 = sp.steamid;
    const accountId = steam64ToAccountId(steam64);
    playerNameMap.set(accountId, sp.personaname);
  }

  // Split players by team
  const team0 = players.filter((p) => p.team === "Team0");
  const team1 = players.filter((p) => p.team === "Team1");

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="relative flex-1">
        <SigilBackground intensity="subtle" />

        <div className="atmosphere-amber relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <FadeIn triggerOnScroll={false}>
            <MatchHeader match={match} ranks={ranks} />
          </FadeIn>

          <ArtDecoDivider className="my-8" />

          <section className="space-y-6">
            <FadeIn delay={0.2}>
              <TeamScoreboard
                teamLabel="Archmother"
                players={team0}
                heroMap={heroMap}
                playerNameMap={playerNameMap}
                isWinner={match.winning_team === "Team0"}
                playerItemsMap={playerItemsMap}
                itemMap={itemMap}
              />
            </FadeIn>

            <div className="flex items-center justify-center gap-4 py-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border-subtle" />
              <span className="font-display text-xl text-amber/60 tracking-widest">VS</span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border-subtle" />
            </div>

            <FadeIn delay={0.4}>
              <TeamScoreboard
                teamLabel="Hidden King"
                players={team1}
                heroMap={heroMap}
                playerNameMap={playerNameMap}
                isWinner={match.winning_team === "Team1"}
                playerItemsMap={playerItemsMap}
                itemMap={itemMap}
              />
            </FadeIn>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
