"use client";

import { SearchBar } from "./SearchBar";
import { useRecentSearches, type RecentSearch } from "@/lib/hooks/useRecentSearches";

/**
 * Compact search bar for use on non-homepage pages (player profile, etc.).
 * No glass panel wrapper, no recent searches — just the search input.
 */
export function PlayerSearchBar() {
  const { addSearch } = useRecentSearches();

  const handlePlayerFound = (player: RecentSearch) => {
    addSearch(player);
  };

  return (
    <div className="w-full">
      <SearchBar onPlayerFound={handlePlayerFound} />
    </div>
  );
}
