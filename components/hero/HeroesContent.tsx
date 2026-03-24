import { Shield } from "lucide-react";
import { HeroGrid } from "@/components/hero/HeroGrid";
import { RankFilter } from "@/components/hero/RankFilter";
import type { HeroWithStats } from "@/components/hero/HeroCard";
import { getHeroes, getHeroAnalytics, getRanks } from "@/lib/api";
import { aggregateHeroAnalytics, parseRankTier } from "@/lib/utils/heroAnalytics";

interface HeroesContentProps {
  searchParams: Promise<{ rank?: string }>;
}

export default async function HeroesContent({ searchParams }: HeroesContentProps) {
  const { rank: rankParam } = await searchParams;

  const [heroes, analytics, ranks] = await Promise.all([
    getHeroes(),
    getHeroAnalytics(),
    getRanks(),
  ]);

  const validMinTier = parseRankTier(rankParam);

  const playableHeroes = heroes.filter(
    (h) => h.player_selectable !== false && !h.disabled && !h.in_development,
  );

  const { analyticsMap, grandTotalMatches } = aggregateHeroAnalytics(analytics, validMinTier);

  const heroesWithStats: HeroWithStats[] = playableHeroes.map((hero) => {
    const stats = analyticsMap.get(hero.id);
    const wins = stats?.wins ?? 0;
    const matches = stats?.matches ?? 0;

    return {
      id: hero.id,
      name: hero.name,
      role: hero.description?.role,
      imageUrl: hero.images?.icon_hero_card_webp,
      winRate: matches > 0 ? (wins / matches) * 100 : 0,
      pickRate: grandTotalMatches > 0 ? (matches / grandTotalMatches) * 100 : 0,
      matches,
    };
  });

  const rankOptions = ranks.map((r) => ({
    tier: r.tier,
    name: r.name,
    color: r.color,
    imageUrl: r.images.large_webp || r.images.large,
  }));

  const activeRank = validMinTier != null
    ? ranks.find((r) => r.tier === validMinTier)
    : null;

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
                ? `Stats for ${activeRank.name}+ rank bracket.`
                : "Global stats across all rank brackets."}
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full glass-panel px-4 py-1.5 text-xs text-text-secondary">
              <Shield className="h-3.5 w-3.5 text-sigil" />
              <span className="font-mono">{playableHeroes.length}</span> playable heroes
            </div>
          </div>

          <RankFilter
            ranks={rankOptions}
            currentMinTier={validMinTier}
            baseUrl="/heroes"
          />
        </div>
      </div>

      <HeroGrid heroes={heroesWithStats} />
    </>
  );
}
