import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Crown, TrendingUp } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SigilBackground } from "@/components/layout/SigilBackground";
import { getHeroes, getHeroAnalytics, getRanks } from "@/lib/api";
import { RankFilter } from "@/components/hero/RankFilter";
import { cn } from "@/lib/utils/cn";
import { FadeIn } from "@/components/motion";

export const metadata: Metadata = {
  title: "Hero Tier List | dltracker",
  description: "Deadlock hero tier list based on global win rate and pick rate.",
};

interface TierHero {
  id: number;
  name: string;
  imageUrl: string | undefined;
  winRate: number;
  pickRate: number;
  matches: number;
  score: number;
}

const TIERS = [
  { label: "S", color: "text-amber", borderColor: "border-amber/40", bgColor: "bg-amber/5", description: "Meta-defining" },
  { label: "A", color: "text-soul", borderColor: "border-soul/40", bgColor: "bg-soul/5", description: "Strong picks" },
  { label: "B", color: "text-sigil", borderColor: "border-sigil/40", bgColor: "bg-sigil/5", description: "Solid choices" },
  { label: "C", color: "text-text-secondary", borderColor: "border-border-subtle", bgColor: "bg-surface/30", description: "Situational" },
  { label: "D", color: "text-blood", borderColor: "border-blood/40", bgColor: "bg-blood/5", description: "Struggling" },
];

interface TierListPageProps {
  searchParams: Promise<{ rank?: string }>;
}

export default async function TierListPage({ searchParams }: TierListPageProps) {
  const { rank: rankParam } = await searchParams;

  const [heroes, analytics, ranks] = await Promise.all([
    getHeroes(),
    getHeroAnalytics(),
    getRanks(),
  ]);

  // Parse minimum rank tier from search params
  const minTier = rankParam != null ? Number(rankParam) : null;
  const validMinTier = minTier != null && Number.isInteger(minTier) && minTier >= 0 && minTier <= 11
    ? minTier
    : null;

  const playableHeroes = heroes.filter(
    (h) => h.player_selectable !== false && !h.disabled && !h.in_development,
  );

  // Aggregate analytics per hero, filtering by min tier
  const analyticsMap = new Map<number, { wins: number; matches: number }>();
  for (const entry of analytics) {
    if (validMinTier != null) {
      const entryTier = Math.floor(entry.bucket / 10);
      if (entryTier < validMinTier) continue;
    }

    const existing = analyticsMap.get(entry.hero_id);
    if (existing) {
      existing.wins += entry.wins;
      existing.matches += entry.matches;
    } else {
      analyticsMap.set(entry.hero_id, { wins: entry.wins, matches: entry.matches });
    }
  }

  let grandTotalMatches = 0;
  for (const { matches } of analyticsMap.values()) grandTotalMatches += matches;

  // Build scored hero list
  const tierHeroes: TierHero[] = playableHeroes
    .map((hero) => {
      const stats = analyticsMap.get(hero.id);
      const wins = stats?.wins ?? 0;
      const matches = stats?.matches ?? 0;
      const winRate = matches > 0 ? (wins / matches) * 100 : 50;
      const pickRate = grandTotalMatches > 0 ? (matches / grandTotalMatches) * 100 : 0;
      const wrScore = winRate - 50;
      const prScore = pickRate * 3;
      const score = wrScore * 0.7 + prScore * 0.3;

      return {
        id: hero.id,
        name: hero.name,
        imageUrl: hero.images?.icon_hero_card_webp,
        winRate,
        pickRate,
        matches,
        score,
      };
    })
    .filter((h) => h.matches > 0)
    .sort((a, b) => b.score - a.score);

  // Distribute into tiers using percentile cuts
  const total = tierHeroes.length;
  const tierAssignments: TierHero[][] = [[], [], [], [], []];

  tierHeroes.forEach((hero, i) => {
    const pct = i / total;
    if (pct < 0.1) tierAssignments[0].push(hero);
    else if (pct < 0.30) tierAssignments[1].push(hero);
    else if (pct < 0.60) tierAssignments[2].push(hero);
    else if (pct < 0.85) tierAssignments[3].push(hero);
    else tierAssignments[4].push(hero);
  });

  // Build rank options for the filter
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
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="relative flex-1 atmosphere-amber">
        <SigilBackground intensity="subtle" />

        <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="font-display text-3xl sm:text-4xl bg-clip-text text-transparent bg-gradient-to-b from-amber-light via-amber to-amber/70">
                  <Crown className="inline-block h-8 w-8 text-amber mr-2 -translate-y-1" />
                  Hero Tier List
                </h1>
                <p className="mt-2 text-text-secondary">
                  {activeRank
                    ? `Heroes ranked by win rate and pick rate in ${activeRank.name}+ bracket.`
                    : "Heroes ranked by win rate and pick rate across all brackets."}
                </p>
              </div>

              <RankFilter
                ranks={rankOptions}
                currentMinTier={validMinTier}
                baseUrl="/heroes/tier-list"
              />
            </div>
          </div>

          <div className="space-y-4">
            {TIERS.map((tier, tierIdx) => {
              const heroesInTier = tierAssignments[tierIdx];
              if (heroesInTier.length === 0) return null;

              return (
                <FadeIn key={tier.label} delay={tierIdx * 0.08}>
                  <div className={cn("glass-panel rounded-lg overflow-hidden border", tier.borderColor)}>
                    {/* Tier header */}
                    <div className={cn("flex items-center gap-3 px-4 py-2 border-b border-border-subtle/50", tier.bgColor)}>
                      <span className={cn("font-display text-2xl w-8", tier.color)}>
                        {tier.label}
                      </span>
                      <span className="text-xs text-text-muted uppercase tracking-wider">
                        {tier.description}
                      </span>
                      <span className="ml-auto text-xs text-text-muted font-mono">
                        {heroesInTier.length} heroes
                      </span>
                    </div>

                    {/* Hero row */}
                    <div className="flex flex-wrap gap-2 p-3">
                      {heroesInTier.map((hero) => (
                        <Link
                          key={hero.id}
                          href={`/heroes/${hero.id}`}
                          className="group flex items-center gap-2 rounded-md glass-panel px-2.5 py-1.5 transition-all hover:border-soul hover:translate-y-[-1px]"
                          title={`${hero.name} — ${hero.winRate.toFixed(1)}% WR, ${hero.pickRate.toFixed(1)}% PR`}
                        >
                          {hero.imageUrl ? (
                            <Image
                              src={hero.imageUrl}
                              alt={hero.name}
                              width={28}
                              height={28}
                              className="rounded"
                            />
                          ) : (
                            <div className="h-7 w-7 rounded bg-surface-elevated" />
                          )}
                          <div className="hidden sm:block">
                            <p className="text-xs text-text-primary group-hover:text-soul transition-colors leading-tight">
                              {hero.name}
                            </p>
                            <p className="text-[10px] font-mono text-text-muted">
                              <span className={hero.winRate >= 50 ? "text-soul" : "text-blood"}>
                                {hero.winRate.toFixed(1)}%
                              </span>
                              {" WR"}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>

          <div className="mt-6 glass-panel rounded-lg p-4 flex items-start gap-3">
            <TrendingUp className="h-4 w-4 text-amber flex-shrink-0 mt-0.5" />
            <p className="text-xs text-text-muted">
              Tier rankings are computed from a weighted combination of win rate (70%) and pick rate (30%){activeRank ? ` for ${activeRank.name}+ matches` : " across all rank brackets"}. Heroes with higher win rates and pick rates score higher. Tiers are distributed by percentile: S (top 10%), A (next 20%), B (next 30%), C (next 25%), D (bottom 15%).
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
