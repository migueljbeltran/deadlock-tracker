import type { Metadata } from "next";
import { Package } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SigilBackground } from "@/components/layout/SigilBackground";
import { ItemGrid } from "@/components/item/ItemGrid";
import { RankFilter } from "@/components/hero/RankFilter";
import type { ItemWithStats } from "@/components/item/ItemCard";
import { getItems, getItemStats, getRanks } from "@/lib/api";

export const metadata: Metadata = {
  title: "Items | dltracker",
  description: "Browse all Deadlock shop items with win rates and pick rates.",
};

interface ItemsPageProps {
  searchParams: Promise<{ rank?: string }>;
}

export default async function ItemsPage({ searchParams }: ItemsPageProps) {
  const { rank: rankParam } = await searchParams;

  // Parse minimum rank tier from search params
  const minTier = rankParam != null ? Number(rankParam) : null;
  const validMinTier = minTier != null && Number.isInteger(minTier) && minTier >= 0 && minTier <= 11
    ? minTier
    : null;

  // Convert tier to min badge value (tier * 10 + 1 for lowest subrank)
  const minBadge = validMinTier != null ? validMinTier * 10 + 1 : undefined;

  const [items, itemStats, ranks] = await Promise.all([
    getItems(),
    getItemStats(minBadge).catch(() => []),
    getRanks(),
  ]);

  // Build stats lookup
  const statsMap = new Map(itemStats.map((s) => [s.item_id, s]));

  // Grand total matches for pick rate
  let grandTotalMatches = 0;
  for (const s of itemStats) {
    grandTotalMatches += s.matches;
  }

  // Filter to shopable items and build display data
  const shopableItems = items.filter((i) => i.shopable);

  const itemsWithStats: ItemWithStats[] = shopableItems
    .map((item) => {
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
    })
;

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

        <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
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

              <RankFilter
                ranks={rankOptions}
                currentMinTier={validMinTier}
                baseUrl="/items"
              />
            </div>
          </div>

          <ItemGrid items={itemsWithStats} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
