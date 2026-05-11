import { getShopableItemsSnapshot, getItemStatsSnapshot, getRanks } from "@/lib/api";
import { ItemsClientView } from "@/components/item/ItemsClientView";
import type { AnalyticsTimeRange } from "@/lib/analyticsTimeRange";

interface ItemsContentProps {
  timeRange: AnalyticsTimeRange;
}

export default async function ItemsContent({ timeRange }: ItemsContentProps) {
  // Use the Redis-backed snapshot instead of raw getItems() — getItems() pulls
  // a 2.5 MB payload from the upstream Deadlock API on every ISR regeneration,
  // while the snapshot already pre-filters to shopable items and caches weekly.
  const [itemsSnapshot, itemStatsSnapshot, ranks] = await Promise.all([
    getShopableItemsSnapshot(),
    getItemStatsSnapshot(timeRange),
    getRanks(),
  ]);

  const shopableItems = itemsSnapshot.data
    .map((i) => ({
      id: i.id,
      name: i.name,
      imageUrl: i.shop_image_webp || i.shop_image || i.image_webp || i.image,
      cost: i.cost ?? 0,
      tier: i.item_tier ?? 0,
      slotType: i.item_slot_type ?? "unknown",
      activation: i.activation,
    }));

  const rankOptions = ranks.map((r) => ({
    tier: r.tier,
    name: r.name,
    color: r.color,
    imageUrl: r.images.large_webp || r.images.large,
  }));

  return (
    <ItemsClientView
      shopableItems={shopableItems}
      itemStats={itemStatsSnapshot.data}
      rankOptions={rankOptions}
      fetchedAt={itemStatsSnapshot.fetchedAt}
      timeRange={timeRange}
    />
  );
}
