"use client";

import { useSearchParams } from "next/navigation";
import { Shield } from "lucide-react";
import { HeroGrid } from "@/components/hero/HeroGrid";
import { RankFilter } from "@/components/hero/RankFilter";
import { DataFreshness } from "@/components/ui/DataFreshness";
import { TimeRangeFilter } from "@/components/ui/TimeRangeFilter";
import type { HeroWithStats } from "@/components/hero/HeroCard";
import type { DeadlockHeroAnalytics } from "@/lib/api/types";
import { aggregateHeroAnalytics, parseRankTier } from "@/lib/utils/heroAnalytics";
import { getAnalyticsTimeRangeLabel, type AnalyticsTimeRange } from "@/lib/analyticsTimeRange";

interface PlayableHero {
  id: number;
  name: string;
  role?: string;
  imageUrl?: string;
}

interface RankOption {
  tier: number;
  name: string;
  color: string;
  imageUrl?: string;
}

interface HeroesClientViewProps {
  playableHeroes: PlayableHero[];
  analytics: DeadlockHeroAnalytics[];
  rankOptions: RankOption[];
  fetchedAt: string;
  timeRange: AnalyticsTimeRange;
}

export function HeroesClientView({
  playableHeroes,
  analytics,
  rankOptions,
  fetchedAt,
  timeRange,
}: HeroesClientViewProps) {
  const searchParams = useSearchParams();
  const validMinTier = parseRankTier(searchParams.get("rank") ?? undefined);

  const { analyticsMap, grandTotalMatches } = aggregateHeroAnalytics(analytics, validMinTier);

  const heroesWithStats: HeroWithStats[] = playableHeroes.map((hero) => {
    const stats = analyticsMap.get(hero.id);
    const wins = stats?.wins ?? 0;
    const matches = stats?.matches ?? 0;

    return {
      id: hero.id,
      name: hero.name,
      role: hero.role,
      imageUrl: hero.imageUrl,
      winRate: matches > 0 ? (wins / matches) * 100 : 0,
      pickRate: grandTotalMatches > 0 ? (matches / grandTotalMatches) * 100 : 0,
      matches,
    };
  });

  const activeRank = validMinTier != null
    ? rankOptions.find((r) => r.tier === validMinTier)
    : null;
  const timeRangeLabel = getAnalyticsTimeRangeLabel(timeRange);

  return (
    <>
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl bg-clip-text text-transparent bg-gradient-to-b from-amber-light via-amber to-amber/70">
              Heroes
            </h1>
            <p className="mt-2 text-text-secondary">
              {activeRank
                ? `${timeRangeLabel} stats for ${activeRank.name}+ rank bracket.`
                : `${timeRangeLabel} stats across all rank brackets.`}
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full glass-panel px-4 py-1.5 text-xs text-text-secondary">
              <Shield className="h-3.5 w-3.5 text-sigil" />
              <span className="font-mono">{playableHeroes.length}</span> playable heroes
            </div>
            <div className="mt-3">
              <DataFreshness fetchedAt={fetchedAt} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <TimeRangeFilter currentRange={timeRange} baseUrl="/heroes" />
            <RankFilter
              ranks={rankOptions}
              currentMinTier={validMinTier}
              baseUrl="/heroes"
            />
          </div>
        </div>
      </div>

      <HeroGrid heroes={heroesWithStats} />
    </>
  );
}
