import type { Metadata } from "next";
import { Shield } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SigilBackground } from "@/components/layout/SigilBackground";
import { HeroGrid } from "@/components/hero/HeroGrid";
import type { HeroWithStats } from "@/components/hero/HeroCard";
import { getHeroes, getHeroAnalytics } from "@/lib/api";

export const metadata: Metadata = {
  title: "Heroes | dltracker",
  description: "Browse all Deadlock heroes with global win rates and pick rates.",
};

export default async function HeroesPage() {
  const [heroes, analytics] = await Promise.all([
    getHeroes(),
    getHeroAnalytics(),
  ]);

  // Filter to playable heroes only
  const playableHeroes = heroes.filter(
    (h) => h.player_selectable !== false && !h.disabled && !h.in_development,
  );

  // Aggregate analytics across rank buckets per hero
  const analyticsMap = new Map<
    number,
    { wins: number; matches: number }
  >();

  for (const entry of analytics) {
    const existing = analyticsMap.get(entry.hero_id);
    if (existing) {
      existing.wins += entry.wins;
      existing.matches += entry.matches;
    } else {
      analyticsMap.set(entry.hero_id, {
        wins: entry.wins,
        matches: entry.matches,
      });
    }
  }

  // Grand total for pick rate denominator
  let grandTotalMatches = 0;
  for (const { matches } of analyticsMap.values()) {
    grandTotalMatches += matches;
  }

  // Build HeroWithStats array
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

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="relative flex-1 atmosphere-soul">
        <SigilBackground intensity="subtle" />

        <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="font-display text-3xl sm:text-4xl bg-clip-text text-transparent bg-gradient-to-b from-amber-light via-amber to-amber/70">
              Heroes
            </h1>
            <p className="mt-2 text-text-secondary">
              Global stats across all rank brackets.
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full glass-panel px-4 py-1.5 text-xs text-text-secondary">
              <Shield className="h-3.5 w-3.5 text-sigil" />
              <span className="font-mono">{playableHeroes.length}</span> playable heroes
            </div>
          </div>

          <HeroGrid heroes={heroesWithStats} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
