"use client";

import { useRouter } from "next/navigation";
import { SearchBar } from "./SearchBar";
import { RecentSearches } from "./RecentSearches";
import { useRecentSearches, type RecentSearch } from "@/lib/hooks/useRecentSearches";

export function HeroSearchSection() {
  const router = useRouter();
  const { searches, addSearch, clearSearches } = useRecentSearches();

  const handlePlayerFound = (player: RecentSearch) => {
    addSearch(player);
  };

  const handleRecentSelect = (search: RecentSearch) => {
    router.push(`/player/${search.accountId}`);
  };

  return (
    <div className="w-full max-w-lg">
      <div className="rounded-xl border border-border-subtle bg-deep p-4 sm:p-5">
        <SearchBar onPlayerFound={handlePlayerFound} />
        <RecentSearches searches={searches} onSelect={handleRecentSelect} onClear={clearSearches} />
      </div>
    </div>
  );
}
