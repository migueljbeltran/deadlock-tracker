"use client";

import { useState, useMemo } from "react";
import { Search, ArrowUp, ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/Input";
import { HeroCard, type HeroWithStats } from "@/components/hero/HeroCard";

type SortOption = "name" | "winRate" | "pickRate" | "matches";

const sortLabels: Record<SortOption, string> = {
  name: "Name",
  winRate: "Win Rate",
  pickRate: "Pick Rate",
  matches: "Matches",
};

interface HeroGridProps {
  heroes: HeroWithStats[];
}

export function HeroGrid({ heroes }: HeroGridProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("winRate");
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    let result = heroes;

    // Filter by search
    if (search.trim()) {
      const query = search.trim().toLowerCase();
      result = result.filter((h) => h.name.toLowerCase().includes(query));
    }

    // Sort
    const dir = sortAsc ? 1 : -1;
    result = [...result].sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name) * dir;
        case "winRate":
          return (a.winRate - b.winRate) * dir;
        case "pickRate":
          return (a.pickRate - b.pickRate) * dir;
        case "matches":
          return (a.matches - b.matches) * dir;
      }
    });

    return result;
  }, [heroes, search, sort, sortAsc]);

  return (
    <div>
      {/* Controls */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Search heroes..."
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

      <p className="text-xs text-text-muted mb-4">
        Showing {filtered.length} of {heroes.length} heroes
      </p>

      {/* Grid with layout animations */}
      {filtered.length > 0 ? (
        <motion.div
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
          layout
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((hero, idx) => (
              <motion.div
                key={hero.id}
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
                <HeroCard hero={hero} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-16">
          <p className="font-heading text-text-secondary">No heroes found</p>
          <p className="text-sm text-text-muted">
            Try adjusting your search query.
          </p>
        </div>
      )}
    </div>
  );
}
