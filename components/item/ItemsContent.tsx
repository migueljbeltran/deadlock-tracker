import { Package } from "lucide-react";
import { ItemGrid } from "@/components/item/ItemGrid";
import { RankFilter } from "@/components/hero/RankFilter";
import { PageRefreshButton } from "@/components/ui/PageRefreshButton";
import { refreshItems } from "@/app/items/actions";
import type { ItemWithStats } from "@/components/item/ItemCard";
import { getItems, getItemStats, getRanks } from "@/lib/api";
import { parseRankTier } from "@/lib/utils/heroAnalytics";

interface ItemsContentProps {
  searchParams: Promise<{ rank?: string }>;
}

export default async function ItemsContent({ searchParams }: ItemsContentProps) {
  const { rank: rankParam } = await searchParams;

  const validMinTier = parseRankTier(rankParam);

  const minBadge = validMinTier != null ? validMinTier * 10 + 1 : undefined;

  const [items, itemStats, ranks] = await Promise.all([
    getItems(),
    getItemStats(minBadge).catch(() => []),
    getRanks(),
  ]);

  const statsMap = new Map(itemStats.map((s) => [s.item_id, s]));

  let grandTotalMatches = 0;
  for (const s of itemStats) {
    grandTotalMatches += s.matches;
  }

  const shopableItems = items.filter((i) => i.shopable);

  const itemsWithStats: ItemWithStats[] = shopableItems.map((item) => {
    const stats = statsMap.get(item.id);
    const wins = stats?.wins ?? 0;
    const matches = stats?.matches ?? 0;

    return {
      id: item.id,
      name: item.name,
      imageUrl: item.shop_image_webp || item.shop_image || item.image_webp || item.image,
      cost: item.cost ?? 0,
      tier: item.item_tier ?? 0,
      slotType: item.item_slot_type ?? "unknown",
      activation: item.activation,
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
              Items
            </h1>
            <p className="mt-2 text-text-secondary">
              {activeRank
                ? `Item win rates for ${activeRank.name}+ matches.`
                : "Shop items with global win rates across all matches."}
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full glass-panel px-4 py-1.5 text-xs text-text-secondary">
              <Package className="h-3.5 w-3.5 text-amber" />
              <span className="font-mono">{itemsWithStats.length}</span> items tracked
            </div>
          </div>

          <div className="flex items-center gap-3">
            <PageRefreshButton action={refreshItems} />
            <RankFilter
              ranks={rankOptions}
              currentMinTier={validMinTier}
              baseUrl="/items"
            />
          </div>
        </div>
      </div>

      <ItemGrid items={itemsWithStats} />
    </>
  );
}
