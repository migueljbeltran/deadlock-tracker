import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SigilBackground } from "@/components/layout/SigilBackground";
import { ArtDecoDivider } from "@/components/layout/ArtDecoDivider";
import { PlayerHeader } from "@/components/player/PlayerHeader";
import { TopHeroes } from "@/components/player/TopHeroes";
import { MatchHistoryList } from "@/components/player/MatchHistoryList";
import {
  accountIdToSteam64,
  getPlayerSummary,
  getPlayerHeroStats,
  getMatchHistory,
  getHeroes,
  getRanks,
} from "@/lib/api";
import { FadeIn } from "@/components/motion";
import { Pagination } from "@/components/ui/Pagination";

const MATCH_PAGE_SIZE = 20;

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
    return { title: "Player Not Found | dltracker" };
  }

  const steam64 = accountIdToSteam64(Number(raw));
  const player = await getPlayerSummary(steam64);

  if (!player) {
    return { title: "Player Not Found | dltracker" };
  }

  return {
    title: `${player.personaname} | dltracker`,
    description: `Deadlock stats and match history for ${player.personaname}`,
  };
}

/**
 * Estimate the player's rank from recent match badge data.
 * Returns the badge level (tier index) or null if no data.
 */
function estimateRankBadge(
  matches: { average_badge_team0?: number | null; average_badge_team1?: number | null }[],
): number | null {
  const badges: number[] = [];

  for (const match of matches) {
    if (match.average_badge_team0 != null) badges.push(match.average_badge_team0);
    if (match.average_badge_team1 != null) badges.push(match.average_badge_team1);
  }

  if (badges.length === 0) return null;

  // Badge values are composite: rank_tier * 10 + subrank (e.g. 43 = tier 4, subrank 3).
  // Divide by 10 and floor to extract the tier index.
  const avg = badges.reduce((sum, b) => sum + b, 0) / badges.length;
  return Math.floor(avg / 10);
}

export default async function PlayerPage({ params, searchParams }: PlayerPageProps) {
  const { accountId: raw } = await params;
  const { page: pageParam } = await searchParams;

  if (!isValidAccountId(raw)) {
    notFound();
  }

  const accountId = Number(raw);
  const steam64 = accountIdToSteam64(accountId);
  const rawPage = Number(pageParam);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  const offset = (page - 1) * MATCH_PAGE_SIZE;
  const fetchLimit = offset + MATCH_PAGE_SIZE + 1;

  // Fetch all data in parallel
  const [player, heroStats, allMatches, heroes, ranks] = await Promise.all([
    getPlayerSummary(steam64),
    getPlayerHeroStats(accountId).catch(() => [] as Awaited<ReturnType<typeof getPlayerHeroStats>>),
    getMatchHistory(accountId, fetchLimit).catch(() => [] as Awaited<ReturnType<typeof getMatchHistory>>),
    getHeroes(),
    getRanks(),
  ]);

  const pageMatches = allMatches.slice(offset, offset + MATCH_PAGE_SIZE);
  const hasNextPage = allMatches.length > offset + MATCH_PAGE_SIZE;

  if (!player) {
    notFound();
  }

  // Build hero lookup map
  const heroMap = new Map(heroes.map((h) => [h.id, h]));

  // Estimate rank from all fetched matches
  const badgeLevel = estimateRankBadge(allMatches);
  const estimatedRank = badgeLevel != null
    ? ranks.find((r) => r.tier === badgeLevel) ?? null
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="relative flex-1">
        <SigilBackground intensity="subtle" />

        <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Player Header */}
          <FadeIn>
            <PlayerHeader
              player={player}
              accountId={accountId}
              estimatedRank={estimatedRank}
            />
          </FadeIn>

          <ArtDecoDivider className="my-8" />

          {/* Top Heroes */}
          <section className="mb-8">
            <FadeIn delay={0.2}>
              <h2 className="font-heading text-xl text-amber mb-4">
                Top Heroes
              </h2>
            </FadeIn>
            <TopHeroes
              heroStats={heroStats}
              heroMap={heroMap}
            />
          </section>

          <ArtDecoDivider variant="simple" className="my-8" />

          {/* Match History */}
          <section key={`matches-page-${page}`}>
            <FadeIn delay={0.3}>
              <h2 className="font-heading text-xl text-amber mb-4">
                Match History
              </h2>
            </FadeIn>
            <MatchHistoryList
              matches={pageMatches}
              accountId={accountId}
              heroMap={heroMap}
            />
            <Pagination
              currentPage={page}
              hasNextPage={hasNextPage}
              baseUrl={`/player/${accountId}`}
            />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
