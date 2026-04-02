import { getItems, getItemStats, getRanks } from "@/lib/api";
import { ItemsClientView } from "@/components/item/ItemsClientView";

export default async function ItemsContent() {
  const [items, itemStats, ranks] = await Promise.all([
    getItems(),
    getItemStats().catch(() => []),
    getRanks(),
  ]);

  const shopableItems = items
    .filter((i) => i.shopable)
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
      itemStats={itemStats}
      rankOptions={rankOptions}
    />
  );
}
