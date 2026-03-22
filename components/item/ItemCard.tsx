import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { GlowCard } from "@/components/motion";

export interface ItemWithStats {
  id: number;
  name: string;
  imageUrl?: string;
  cost: number;
  tier: number;
  slotType: string;
  activation?: string;
  winRate: number;
  pickRate: number;
  matches: number;
}

const TIER_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "T1", color: "text-text-secondary border-border-subtle" },
  2: { label: "T2", color: "text-sigil border-sigil/40" },
  3: { label: "T3", color: "text-soul border-soul/40" },
  4: { label: "T4", color: "text-amber border-amber/40" },
  5: { label: "T5", color: "text-blood border-blood/40" },
};

const SLOT_COLORS: Record<string, string> = {
  weapon: "border-l-amber",
  vitality: "border-l-soul",
  spirit: "border-l-spirit",
};

interface ItemCardProps {
  item: ItemWithStats;
}

export function ItemCard({ item }: ItemCardProps) {
  const tierInfo = TIER_LABELS[item.tier] ?? { label: `T${item.tier}`, color: "text-text-muted" };

  return (
    <GlowCard>
      <div className={cn("p-4 border-l-2", SLOT_COLORS[item.slotType] ?? "border-l-text-muted")}>
        <div className="flex items-center gap-3">
          {item.imageUrl ? (
            <div className="overflow-hidden rounded">
              <Image
                src={item.imageUrl}
                alt={item.name}
                width={48}
                height={48}
                className="rounded transition-transform duration-300 hover:scale-110"
              />
            </div>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded bg-surface-elevated text-text-muted text-xs">
              ?
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-heading text-sm text-text-primary">
              {item.name}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded border", tierInfo.color)}>
                {tierInfo.label}
              </span>
              <span className="text-xs font-mono text-amber">
                {item.cost.toLocaleString()}
              </span>
              <span className="text-[10px] text-text-muted capitalize">
                {item.slotType}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs">
          <span
            className={cn(
              "font-mono text-sm font-semibold",
              item.winRate >= 50 ? "text-soul" : "text-blood",
            )}
          >
            {item.winRate.toFixed(1)}% WR
          </span>
          <span className="font-mono text-text-secondary">
            {item.matches >= 1_000_000
              ? (item.matches / 1_000_000).toFixed(1) + "M"
              : item.matches >= 1_000
                ? (item.matches / 1_000).toFixed(0) + "k"
                : item.matches.toLocaleString()}{" "}
            matches
          </span>
        </div>

        {/* Win rate bar */}
        <div className="winrate-bar mt-2 w-full">
          <div
            className="winrate-bar-fill"
            style={{ width: `${item.winRate}%` }}
          />
        </div>
      </div>
    </GlowCard>
  );
}
