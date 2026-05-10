import { getHeroes, getHeroAnalyticsSnapshot, getRanks } from "@/lib/api";
import { TierListClientView } from "@/components/hero/TierListClientView";
import type { AnalyticsTimeRange } from "@/lib/analyticsTimeRange";

interface TierListContentProps {
  timeRange: AnalyticsTimeRange;
}

export default async function TierListContent({ timeRange }: TierListContentProps) {
  const [heroes, analyticsSnapshot, ranks] = await Promise.all([
    getHeroes(),
    getHeroAnalyticsSnapshot(timeRange),
    getRanks(),
  ]);

  const playableHeroes = heroes
    .filter((h) => h.player_selectable !== false && !h.disabled && !h.in_development)
    .map((h) => ({
      id: h.id,
      name: h.name,
      imageUrl: h.images?.icon_hero_card_webp,
    }));

  const rankOptions = ranks.map((r) => ({
    tier: r.tier,
    name: r.name,
    color: r.color,
    imageUrl: r.images.large_webp || r.images.large,
  }));

  return (
    <TierListClientView
      playableHeroes={playableHeroes}
      analytics={analyticsSnapshot.data}
      rankOptions={rankOptions}
      fetchedAt={analyticsSnapshot.fetchedAt}
      timeRange={timeRange}
    />
  );
}
