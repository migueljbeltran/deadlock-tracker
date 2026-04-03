import { getHeroes, getHeroAnalyticsSnapshot, getRanks } from "@/lib/api";
import { HeroesClientView } from "@/components/hero/HeroesClientView";

export default async function HeroesContent() {
  const [heroes, analyticsSnapshot, ranks] = await Promise.all([
    getHeroes(),
    getHeroAnalyticsSnapshot(),
    getRanks(),
  ]);

  const playableHeroes = heroes
    .filter((h) => h.player_selectable !== false && !h.disabled && !h.in_development)
    .map((h) => ({
      id: h.id,
      name: h.name,
      role: h.description?.role,
      imageUrl: h.images?.icon_hero_card_webp,
    }));

  const rankOptions = ranks.map((r) => ({
    tier: r.tier,
    name: r.name,
    color: r.color,
    imageUrl: r.images.large_webp || r.images.large,
  }));

  return (
    <HeroesClientView
      playableHeroes={playableHeroes}
      analytics={analyticsSnapshot.data}
      rankOptions={rankOptions}
      fetchedAt={analyticsSnapshot.fetchedAt}
    />
  );
}
