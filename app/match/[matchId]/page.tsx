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
  getHeroes,
  getPlayerSummaries,
  accountIdToSteam64,
} from "@/lib/api";
import type { SteamPlayerSummary } from "@/lib/api";
import { FadeIn } from "@/components/motion";

interface MatchDetailPageProps {
  params: Promise<{ matchId: string }>;
}

export async function generateMetadata(
  { params }: MatchDetailPageProps,
): Promise<Metadata> {
  const { matchId } = await params;
  return {
    title: `Match #${matchId} | dltracker`,
    description: `Match details and scoreboard for match ${matchId} in Deadlock.`,
  };
}

export default async function MatchDetailPage({ params }: MatchDetailPageProps) {
  const { matchId } = await params;
  const id = Number(matchId);
  if (isNaN(id)) notFound();

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
  const [heroes, steamPlayers] = await Promise.all([
    getHeroes(),
    getPlayerSummaries(steam64Ids).catch(() => [] as SteamPlayerSummary[]),
  ]);

  const heroMap = new Map(heroes.map((h) => [h.id, h]));

  // Map account_id → player name (bridge Steam names to Deadlock IDs)
  const playerNameMap = new Map<number, string>();
  for (const sp of steamPlayers) {
    const steam64 = sp.steamid;
    // Reverse: steam64 → accountId to key by account_id
    const accountId = Number(BigInt(steam64) - BigInt("76561197960265728"));
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

        <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <FadeIn>
            <MatchHeader match={match} />
          </FadeIn>

          <ArtDecoDivider className="my-8" />

          <section className="space-y-6">
            <FadeIn delay={0.2}>
              <TeamScoreboard
                teamLabel="Amber Hand"
                players={team0}
                heroMap={heroMap}
                playerNameMap={playerNameMap}
                isWinner={match.winning_team === "Team0"}
              />
            </FadeIn>

            <FadeIn delay={0.4}>
              <TeamScoreboard
                teamLabel="Sapphire Flame"
                players={team1}
                heroMap={heroMap}
                playerNameMap={playerNameMap}
                isWinner={match.winning_team === "Team1"}
              />
            </FadeIn>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
