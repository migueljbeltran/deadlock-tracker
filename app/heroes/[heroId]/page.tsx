import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SigilBackground } from "@/components/layout/SigilBackground";
import { ArtDecoDivider } from "@/components/layout/ArtDecoDivider";
import { HeroDetailHeader } from "@/components/hero/HeroDetailHeader";
import { HeroDescription } from "@/components/hero/HeroDescription";
import { HeroGlobalStats } from "@/components/hero/HeroGlobalStats";
import { getHero, getHeroAnalytics } from "@/lib/api";

interface HeroDetailPageProps {
  params: Promise<{ heroId: string }>;
}

export async function generateMetadata(
  { params }: HeroDetailPageProps,
): Promise<Metadata> {
  const { heroId } = await params;
  const id = Number(heroId);
  if (isNaN(id)) return { title: "Hero Not Found | dltracker" };

  try {
    const hero = await getHero(id);
    return {
      title: `${hero.name} | dltracker`,
      description: `Global stats and info for ${hero.name} in Deadlock.`,
    };
  } catch {
    return { title: "Hero Not Found | dltracker" };
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

  // Fetch analytics in parallel (non-blocking — page still renders without stats)
  const analytics = await getHeroAnalytics().catch(() => []);

  // Aggregate stats across rank buckets for this hero
  let totalWins = 0;
  let totalMatches = 0;
  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  let totalDamage = 0;
  let totalNetWorth = 0;

  for (const entry of analytics) {
    if (entry.hero_id !== id) continue;
    totalWins += entry.wins;
    totalMatches += entry.matches;
    totalKills += entry.total_kills;
    totalDeaths += entry.total_deaths;
    totalAssists += entry.total_assists;
    totalDamage += entry.total_player_damage;
    totalNetWorth += entry.total_net_worth;
  }

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
              />
            ) : (
              <p className="text-sm text-text-muted">
                No analytics data available for this hero yet.
              </p>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
