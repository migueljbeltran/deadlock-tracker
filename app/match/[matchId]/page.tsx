import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SigilBackground } from "@/components/layout/SigilBackground";
import { ArtDecoDivider } from "@/components/layout/ArtDecoDivider";
import { MatchHeader } from "@/components/match/MatchHeader";
import { TeamScoreboard } from "@/components/match/TeamScoreboard";
import {
  getHeroes,
  getShopableItemsSnapshot,
  getRanks,
  getPlayerSummaries,
  accountIdToSteam64,
  steam64ToAccountId,
} from "@/lib/api";
import type { SteamPlayerSummary, DeadlockItem } from "@/lib/api";
import { getMatchSnapshot } from "@/lib/matchSnapshot";
import { FadeIn } from "@/components/motion";
import { matchIdSchema } from "@/lib/validations";

// Match data is immutable — cache permanently, never rewrite
export const revalidate = false;

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
  const parsed = matchIdSchema.safeParse(matchId);
  const safeMatchId = parsed.success ? String(parsed.data) : "unknown";
  return {
    title: `Match #${safeMatchId} — Deadlock Match Details`,
    description: `Scoreboard, team composition, and player stats for Deadlock match #${safeMatchId}.`,
    robots: { index: false },
    alternates: {
      canonical: parsed.success ? `/match/${parsed.data}` : "/match",
    },
  };
}

export default async function MatchDetailPage({ params }: MatchDetailPageProps) {
  const { matchId } = await params;
  const parsed = matchIdSchema.safeParse(matchId);
  if (!parsed.success) notFound();
  const id = parsed.data;

  const matchSnapshot = await getMatchSnapshot(id);
  if (!matchSnapshot) notFound();

  const match = matchSnapshot.match;
  const players = match.players ?? [];
  if (players.length === 0) notFound();

  // Convert account IDs → Steam64 for the Steam API name lookup
  const steam64Ids = players.map((p) => accountIdToSteam64(p.account_id));
  const [heroes, ranks, steamPlayers, shopableItemsSnapshot, playerItemsMap] = await Promise.all([
    getHeroes(),
    getRanks(),
    getPlayerSummaries(steam64Ids).catch(() => [] as SteamPlayerSummary[]),
    getShopableItemsSnapshot().catch(() => null),
    Promise.resolve(new Map<number, number[]>(matchSnapshot.playerItems)),
  ]);

  const heroMap = new Map(heroes.map((h) => [h.id, h]));

  // Build item lookup from Redis-cached shopable items snapshot
  const itemMap = new Map<number, DeadlockItem>();
  for (const item of shopableItemsSnapshot?.data ?? []) {
    itemMap.set(item.id, item);
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
