"use client";

import { useState, useMemo } from "react";
import { Search, Swords, Heart, Sparkles, ArrowUp, ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/Input";
import { ItemCard, type ItemWithStats } from "@/components/item/ItemCard";
import { cn } from "@/lib/utils/cn";

type SortOption = "name" | "winRate" | "cost" | "matches";
type SlotFilter = "all" | "weapon" | "vitality" | "spirit";
type TierFilter = 0 | 1 | 2 | 3 | 4 | 5;

const sortLabels: Record<SortOption, string> = {
  name: "Name",
  winRate: "Win Rate",
  cost: "Cost",
  matches: "Matches",
};

const slotOptions: { value: SlotFilter; label: string; icon: React.ReactNode }[] = [
  { value: "all", label: "All", icon: null },
  { value: "weapon", label: "Weapon", icon: <Swords className="h-3.5 w-3.5" /> },
  { value: "vitality", label: "Vitality", icon: <Heart className="h-3.5 w-3.5" /> },
  { value: "spirit", label: "Spirit", icon: <Sparkles className="h-3.5 w-3.5" /> },
];

const SLOT_ACTIVE_COLORS: Record<string, string> = {
  all: "bg-text-primary text-deep",
  weapon: "bg-amber text-deep",
  vitality: "bg-soul text-deep",
  spirit: "bg-spirit text-deep",
};

interface ItemGridProps {
  items: ItemWithStats[];
}

export function ItemGrid({ items }: ItemGridProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("winRate");
  const [sortAsc, setSortAsc] = useState(true);
  const [slotFilter, setSlotFilter] = useState<SlotFilter>("all");
  const [tierFilter, setTierFilter] = useState<TierFilter>(0);

  const filtered = useMemo(() => {
    let result = items;

    if (search.trim()) {
      const query = search.trim().toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(query));
    }

    if (slotFilter !== "all") {
      result = result.filter((i) => i.slotType === slotFilter);
    }

    if (tierFilter > 0) {
      result = result.filter((i) => i.tier === tierFilter);
    }

    const dir = sortAsc ? 1 : -1;
    result = [...result].sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name) * dir;
        case "winRate":
          return (a.winRate - b.winRate) * dir;
        case "cost":
          return (a.cost - b.cost) * dir;
        case "matches":
          return (a.matches - b.matches) * dir;
      }
    });

    return result;
  }, [items, search, sort, sortAsc, slotFilter, tierFilter]);

  return (
    <div>
      {/* Controls */}
      <div className="mb-6 flex flex-col gap-3">
        {/* Search + Sort row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="h-10 rounded border border-border-subtle bg-[rgba(22,27,34,0.92)] px-3 text-sm text-text-primary transition-all duration-200 focus:border-soul focus:outline-none focus:ring-2 focus:ring-soul-glow"
            >
              {(Object.entries(sortLabels) as [SortOption, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
            <button
              onClick={() => setSortAsc((prev) => !prev)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-border-subtle bg-[rgba(22,27,34,0.92)] text-text-secondary transition-all duration-200 hover:border-soul hover:text-soul focus:outline-none focus:ring-2 focus:ring-soul-glow"
              title={sortAsc ? "Ascending — click to reverse" : "Descending — click to reverse"}
            >
              {sortAsc ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Slot filter tabs + Tier filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 glass-panel rounded-lg p-1">
            {slotOptions.map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => setSlotFilter(value)}
                className={cn(
                  "flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors",
                  slotFilter === value
                    ? SLOT_ACTIVE_COLORS[value]
                    : "text-text-secondary hover:text-text-primary",
                )}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-1 glass-panel rounded-lg p-1">
            <button
              onClick={() => setTierFilter(0)}
              className={cn(
                "rounded px-2.5 py-1.5 text-xs font-medium transition-colors",
                tierFilter === 0 ? "bg-text-primary text-deep" : "text-text-secondary hover:text-text-primary",
              )}
            >
              All
            </button>
            {[1, 2, 3, 4, 5].map((t) => (
              <button
                key={t}
                onClick={() => setTierFilter(t as TierFilter)}
                className={cn(
                  "rounded px-2.5 py-1.5 text-xs font-mono font-medium transition-colors",
                  tierFilter === t ? "bg-text-primary text-deep" : "text-text-secondary hover:text-text-primary",
                )}
              >
                T{t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-text-muted mb-4">
        Showing {filtered.length} of {items.length} items
      </p>

      {filtered.length > 0 ? (
        <motion.div
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
          layout
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((item, idx) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  layout: { duration: 0.3, ease: "easeInOut" },
                  opacity: { duration: 0.2 },
                  scale: { duration: 0.2 },
                  delay: idx < 20 ? idx * 0.02 : 0,
                }}
              >
                <ItemCard item={item} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-16">
          <p className="font-heading text-text-secondary">No items found</p>
          <p className="text-sm text-text-muted">
            Try adjusting your filters or search query.
          </p>
        </div>
      )}
    </div>
  );
}
