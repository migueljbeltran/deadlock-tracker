"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Package } from "lucide-react";
import { ItemGrid } from "@/components/item/ItemGrid";
import { RankFilter } from "@/components/hero/RankFilter";
import { DataFreshness } from "@/components/ui/DataFreshness";
import { TimeRangeFilter } from "@/components/ui/TimeRangeFilter";
import type { ItemWithStats } from "@/components/item/ItemCard";
import type { DeadlockItemStats } from "@/lib/api/types";
import { parseRankTier } from "@/lib/utils/heroAnalytics";
import { getAnalyticsTimeRangeLabel, type AnalyticsTimeRange } from "@/lib/analyticsTimeRange";

interface ShopableItem {
  id: number;
  name: string;
  imageUrl?: string;
  cost: number;
  tier: number;
  slotType: string;
  activation?: string;
}

interface RankOption {
  tier: number;
  name: string;
  color: string;
  imageUrl?: string;
}

interface ItemsClientViewProps {
  shopableItems: ShopableItem[];
  itemStats: DeadlockItemStats[];
  rankOptions: RankOption[];
  fetchedAt: string;
  timeRange: AnalyticsTimeRange;
}

export function ItemsClientView({
  shopableItems,
  itemStats,
  rankOptions,
  fetchedAt,
  timeRange,
}: ItemsClientViewProps) {
  const searchParams = useSearchParams();
  const validMinTier = parseRankTier(searchParams.get("rank") ?? undefined);

  const { statsMap, grandTotalMatches } = useMemo(() => {
    // Filter stats by rank bucket (same pattern as hero analytics)
    const filtered = validMinTier != null
      ? itemStats.filter((s) => Math.floor(s.bucket / 10) >= validMinTier)
      : itemStats;

    // Aggregate per item_id across matching buckets
    const map = new Map<number, { wins: number; matches: number }>();
    for (const s of filtered) {
      const existing = map.get(s.item_id);
      if (existing) {
        existing.wins += s.wins;
        existing.matches += s.matches;
      } else {
        map.set(s.item_id, { wins: s.wins, matches: s.matches });
      }
    }

    let total = 0;
    for (const { matches } of map.values()) {
      total += matches;
    }

    return { statsMap: map, grandTotalMatches: total };
  }, [itemStats, validMinTier]);

  const itemsWithStats: ItemWithStats[] = shopableItems.map((item) => {
    const stats = statsMap.get(item.id);
    const wins = stats?.wins ?? 0;
    const matches = stats?.matches ?? 0;

    return {
      id: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      cost: item.cost,
      tier: item.tier,
      slotType: item.slotType,
      activation: item.activation,
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
              Items
            </h1>
            <p className="mt-2 text-text-secondary">
              {activeRank
                ? `${timeRangeLabel} item win rates for ${activeRank.name}+ matches.`
                : `${timeRangeLabel} item win rates across all matches.`}
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full glass-panel px-4 py-1.5 text-xs text-text-secondary">
              <Package className="h-3.5 w-3.5 text-amber" />
              <span className="font-mono">{itemsWithStats.length}</span> items tracked
            </div>
            <div className="mt-3">
              <DataFreshness fetchedAt={fetchedAt} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <TimeRangeFilter currentRange={timeRange} baseUrl="/items" />
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
