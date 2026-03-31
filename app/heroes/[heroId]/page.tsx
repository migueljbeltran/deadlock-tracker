export const revalidate = 21600; // ISR: cache hero detail for 6 hours

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SigilBackground } from "@/components/layout/SigilBackground";
import { ArtDecoDivider } from "@/components/layout/ArtDecoDivider";
import { HeroDetailHeader } from "@/components/hero/HeroDetailHeader";
import { HeroDescription } from "@/components/hero/HeroDescription";
import { HeroGlobalStats } from "@/components/hero/HeroGlobalStats";
import { getHero, getHeroes, getHeroAnalytics, getRanks } from "@/lib/api";
import type { DeadlockHeroAnalytics } from "@/lib/api";
import { HeroRankBreakdown } from "@/components/hero/HeroRankBreakdown";
import { FadeIn } from "@/components/motion";

interface HeroDetailPageProps {
  params: Promise<{ heroId: string }>;
}

export async function generateStaticParams() {
  const heroes = await getHeroes();
  return heroes
    .filter((h) => h.player_selectable !== false && !h.disabled && !h.in_development)
    .map((h) => ({ heroId: String(h.id) }));
}

export async function generateMetadata(
  { params }: HeroDetailPageProps,
): Promise<Metadata> {
  const { heroId } = await params;
  const id = Number(heroId);
  if (isNaN(id)) return { title: "Hero Not Found" };

  try {
    const hero = await getHero(id);
    const description = `${hero.name} stats in Deadlock — win rate, pick rate, and performance breakdown by rank. View global analytics for ${hero.name}.`;
    return {
      title: `${hero.name} — Deadlock Hero Stats & Win Rate`,
      description,
      alternates: {
        canonical: `/heroes/${heroId}`,
      },
      openGraph: {
        title: `${hero.name} — Deadlock Hero Stats`,
        description,
        url: `/heroes/${heroId}`,
        images: hero.images?.minimap_image
          ? [{ url: hero.images.minimap_image, alt: hero.name }]
          : undefined,
      },
    };
  } catch {
    return { title: "Hero Not Found" };
  }
}

export default async function HeroDetailPage({ params }: HeroDetailPageProps) {
  const { heroId } = await params;
  const id = Number(heroId);
  if (isNaN(id)) notFound();

  let hero;
  try {
    hero = await getHero(id);
  } catch {
    notFound();
  }

  // Fetch analytics + ranks in parallel
  const [analytics, ranks] = await Promise.all([
    getHeroAnalytics().catch(() => []),
    getRanks(),
  ]);

  // Aggregate stats across rank buckets for this hero
  let totalWins = 0;
  let totalMatches = 0;
  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  let totalDamage = 0;
  let totalNetWorth = 0;
  let totalShotsHit = 0;
  let totalShotsMissed = 0;
  let totalBossDamage = 0;
  let totalCreepDamage = 0;
  let totalNeutralDamage = 0;
  let totalDamageTaken = 0;

  // Aggregate per-subrank entries into per-tier for rank breakdown
  // API returns composite bucket values (tier*10 + subrank, e.g. 53 = tier 5 subrank 3)
  const tierMap = new Map<number, DeadlockHeroAnalytics>();

  for (const entry of analytics) {
    if (entry.hero_id !== id) continue;
    totalWins += entry.wins;
    totalMatches += entry.matches;
    totalKills += entry.total_kills;
    totalDeaths += entry.total_deaths;
    totalAssists += entry.total_assists;
    totalDamage += entry.total_player_damage;
    totalNetWorth += entry.total_net_worth;
    totalShotsHit += entry.total_shots_hit;
    totalShotsMissed += entry.total_shots_missed;
    totalBossDamage += entry.total_boss_damage;
    totalCreepDamage += entry.total_creep_damage;
    totalNeutralDamage += entry.total_neutral_damage;
    totalDamageTaken += entry.total_player_damage_taken;

    const tier = Math.floor(entry.bucket / 10);
    const existing = tierMap.get(tier);
    if (existing) {
      existing.wins += entry.wins;
      existing.losses += entry.losses;
      existing.matches += entry.matches;
      existing.players += entry.players;
      existing.total_kills += entry.total_kills;
      existing.total_deaths += entry.total_deaths;
      existing.total_assists += entry.total_assists;
      existing.total_net_worth += entry.total_net_worth;
      existing.total_last_hits += entry.total_last_hits;
      existing.total_denies += entry.total_denies;
      existing.total_player_damage += entry.total_player_damage;
      existing.total_player_damage_taken += entry.total_player_damage_taken;
      existing.total_boss_damage += entry.total_boss_damage;
      existing.total_creep_damage += entry.total_creep_damage;
      existing.total_neutral_damage += entry.total_neutral_damage;
      existing.total_shots_hit += entry.total_shots_hit;
      existing.total_shots_missed += entry.total_shots_missed;
      existing.total_max_health += entry.total_max_health;
    } else {
      tierMap.set(tier, { ...entry, bucket: tier });
    }
  }

  const heroRankAnalytics = Array.from(tierMap.values());

  // Compute global pick rate denominator
  const analyticsMap = new Map<number, number>();
  for (const entry of analytics) {
    analyticsMap.set(
      entry.hero_id,
      (analyticsMap.get(entry.hero_id) ?? 0) + entry.matches,
    );
  }
  let grandTotalMatches = 0;
  for (const m of analyticsMap.values()) grandTotalMatches += m;

  const winRate = totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0;
  const pickRate = grandTotalMatches > 0 ? (totalMatches / grandTotalMatches) * 100 : 0;
  const avgKills = totalMatches > 0 ? totalKills / totalMatches : 0;
  const avgDeaths = totalMatches > 0 ? totalDeaths / totalMatches : 0;
  const avgAssists = totalMatches > 0 ? totalAssists / totalMatches : 0;
  const avgDamage = totalMatches > 0 ? totalDamage / totalMatches : 0;
  const avgNetWorth = totalMatches > 0 ? totalNetWorth / totalMatches : 0;
  const accuracy = (totalShotsHit + totalShotsMissed) > 0
    ? (totalShotsHit / (totalShotsHit + totalShotsMissed)) * 100
    : 0;
  const avgBossDamage = totalMatches > 0 ? totalBossDamage / totalMatches : 0;
  const avgCreepDamage = totalMatches > 0 ? totalCreepDamage / totalMatches : 0;
  const avgNeutralDamage = totalMatches > 0 ? totalNeutralDamage / totalMatches : 0;
  const avgDamageTaken = totalMatches > 0 ? totalDamageTaken / totalMatches : 0;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="relative flex-1 atmosphere-amber">
        <SigilBackground intensity="subtle" />

        <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <HeroDetailHeader hero={hero} />

          <ArtDecoDivider className="my-8" />

          {hero.description && (
            <>
              <HeroDescription description={hero.description} />
              <ArtDecoDivider variant="simple" className="my-8" />
            </>
          )}

          <section>
            <h2 className="font-heading text-xl text-amber mb-4">
              Global Statistics
            </h2>
            {totalMatches > 0 ? (
              <HeroGlobalStats
                winRate={winRate}
                pickRate={pickRate}
                totalMatches={totalMatches}
                avgKills={avgKills}
                avgDeaths={avgDeaths}
                avgAssists={avgAssists}
                avgDamage={avgDamage}
                avgNetWorth={avgNetWorth}
                accuracy={accuracy}
                avgBossDamage={avgBossDamage}
                avgCreepDamage={avgCreepDamage}
                avgNeutralDamage={avgNeutralDamage}
                avgDamageTaken={avgDamageTaken}
              />
            ) : (
              <p className="text-sm text-text-muted">
                No analytics data available for this hero yet.
              </p>
            )}
          </section>

          {/* Rank Breakdown */}
          {heroRankAnalytics.length > 0 && (
            <>
              <ArtDecoDivider variant="simple" className="my-8" />
              <section>
                <FadeIn>
                  <h2 className="font-heading text-xl text-amber mb-4">
                    Performance by Rank
                  </h2>
                </FadeIn>
                <FadeIn delay={0.1}>
                  <HeroRankBreakdown analytics={heroRankAnalytics} ranks={ranks} />
                </FadeIn>
              </section>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
