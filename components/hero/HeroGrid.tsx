"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { HeroCard, type HeroWithStats } from "@/components/hero/HeroCard";

type SortOption = "name" | "winRate" | "pickRate" | "matches";

const sortLabels: Record<SortOption, string> = {
  name: "Name (A–Z)",
  winRate: "Win Rate (High → Low)",
  pickRate: "Pick Rate (High → Low)",
  matches: "Matches (High → Low)",
};

interface HeroGridProps {
  heroes: HeroWithStats[];
}

export function HeroGrid({ heroes }: HeroGridProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("name");

  const filtered = useMemo(() => {
    let result = heroes;

    // Filter by search
    if (search.trim()) {
      const query = search.trim().toLowerCase();
      result = result.filter((h) => h.name.toLowerCase().includes(query));
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name);
        case "winRate":
          return b.winRate - a.winRate;
        case "pickRate":
          return b.pickRate - a.pickRate;
        case "matches":
          return b.matches - a.matches;
      }
    });

    return result;
  }, [heroes, search, sort]);

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

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="h-10 rounded border border-border-subtle bg-surface px-3 text-sm text-text-primary transition-all duration-200 focus:border-soul focus:outline-none focus:ring-2 focus:ring-soul-glow"
        >
          {(Object.entries(sortLabels) as [SortOption, string][]).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ),
          )}
        </select>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((hero) => (
            <HeroCard key={hero.id} hero={hero} />
          ))}
        </div>
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
