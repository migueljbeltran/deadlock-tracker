import { notFound } from "next/navigation";
import { ArtDecoDivider } from "@/components/layout/ArtDecoDivider";
import { PlayerHeader } from "@/components/player/PlayerHeader";
import { TopHeroes } from "@/components/player/TopHeroes";
import { CareerStats } from "@/components/player/CareerStats";
import { PlayerPercentiles } from "@/components/player/PlayerPercentiles";
import { PlayerMatchSection } from "@/components/player/PlayerMatchSection";
import { FadeIn } from "@/components/motion";
import type { DeadlockPlayerMetrics } from "@/lib/api";
import {
  getPlayerIdentity,
  getPlayerHeroStats,
  getMatchHistory,
  getHeroes,
  getRanks,
  getPlayerMetrics,
} from "@/lib/api";

const MATCH_PAGE_SIZE = 20;
const MAX_MATCH_PAGES = 5; // Cap at 100 matches to limit API payload size
const FETCH_LIMIT = MATCH_PAGE_SIZE * MAX_MATCH_PAGES + 1; // 101

/**
 * Estimate the player's rank from recent match badge data.
 * Badge values are composite: rank_tier * 10 + subrank (e.g. 53 = tier 5, subrank 3).
 */
function estimateRankBadge(
  matches: {
    match_mode?: string;
    average_badge_team0?: number | null;
    average_badge_team1?: number | null;
    players?: { account_id: number; team: string }[];
  }[],
  accountId: number,
): { tier: number; subrank: number } | null {
  const badges: number[] = [];
  const recentMatches = matches.slice(0, 10);

  for (const match of recentMatches) {
    if (match.match_mode === "PrivateLobby") continue;
    const playerEntry = match.players?.find((p) => p.account_id === accountId);

    if (playerEntry) {
      const badge = playerEntry.team === "Team0"
        ? match.average_badge_team0
        : match.average_badge_team1;
      if (badge != null && badge > 0) badges.push(badge);
    } else {
      const b0 = match.average_badge_team0;
      const b1 = match.average_badge_team1;
      if (b0 != null && b0 > 0 && b1 != null && b1 > 0) {
        badges.push(Math.max(b0, b1));
      } else if (b0 != null && b0 > 0) {
        badges.push(b0);
      } else if (b1 != null && b1 > 0) {
        badges.push(b1);
      }
    }
  }

  if (badges.length === 0) return null;

  const avg = badges.reduce((sum, b) => sum + b, 0) / badges.length;
  const tier = Math.floor(avg / 10);
  const subrank = Math.min(6, Math.max(1, Math.round(avg % 10)));
  return { tier, subrank };
}

interface PlayerContentProps {
  accountId: number;
}

export default async function PlayerContent({ accountId }: PlayerContentProps) {
  const [player, heroStats, allMatches, heroes, ranks, playerMetrics] = await Promise.all([
    getPlayerIdentity(accountId),
    getPlayerHeroStats(accountId),
    getMatchHistory(accountId, FETCH_LIMIT),
    getHeroes(),
    getRanks(),
    getPlayerMetrics(accountId).catch(() => null as DeadlockPlayerMetrics | null),
  ]);

  if (!player) {
    notFound();
  }

  const heroMap = new Map(heroes.map((h) => [h.id, h]));

  const badgeEstimate = estimateRankBadge(allMatches, accountId);
  const estimatedRank = badgeEstimate != null
    ? ranks.find((r) => r.tier === badgeEstimate.tier) ?? null
    : null;
  const estimatedSubrank = badgeEstimate?.subrank ?? null;

  // Lightweight hero lookup for client-side match rendering
  const matchHeroEntries = heroes.map((h) => ({
    id: h.id,
    name: h.name,
    iconUrl: h.images?.icon_image_small_webp,
  }));

  return (
    <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Player Header */}
      <FadeIn triggerOnScroll={false}>
        <PlayerHeader
          player={player}
          accountId={accountId}
          estimatedRank={estimatedRank}
          estimatedSubrank={estimatedSubrank}
        />
      </FadeIn>

      {/* Career Stats */}
      {heroStats.length > 0 && (
        <>
          <ArtDecoDivider className="my-8" />
          <section className="mb-8">
            <FadeIn delay={0.15}>
              <h2 className="font-heading text-xl text-amber mb-4">
                Career Overview
              </h2>
            </FadeIn>
            <FadeIn delay={0.2}>
              <CareerStats heroStats={heroStats} />
            </FadeIn>
          </section>
        </>
      )}

      {/* Performance Percentiles */}
      {playerMetrics && Object.keys(playerMetrics).length > 0 && (
        <>
          <ArtDecoDivider variant="simple" className="my-8" />
          <section className="mb-8">
            <FadeIn delay={0.25}>
              <h2 className="font-heading text-xl text-amber mb-4">
                Performance Ranking
              </h2>
            </FadeIn>
            <FadeIn delay={0.3}>
              <PlayerPercentiles metrics={playerMetrics} />
            </FadeIn>
          </section>
        </>
      )}

      <ArtDecoDivider className="my-8" />

      {/* Top Heroes */}
      <section className="mb-8">
        <FadeIn delay={0.35}>
          <h2 className="font-heading text-xl text-amber mb-4">
            Top Heroes
          </h2>
        </FadeIn>
        <div className="glass-panel rounded-xl p-6">
          <TopHeroes
            heroStats={heroStats}
            heroMap={Object.fromEntries(heroMap)}
          />
        </div>
      </section>

      <ArtDecoDivider variant="simple" className="my-8" />

      {/* Match History — client-side pagination */}
      <PlayerMatchSection
        allMatches={allMatches}
        accountId={accountId}
        heroEntries={matchHeroEntries}
      />
    </div>
  );
}
