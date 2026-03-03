"use client";

import { useRouter } from "next/navigation";
import { SearchBar } from "./SearchBar";
import { RecentSearches } from "./RecentSearches";
import { useRecentSearches, type RecentSearch } from "@/lib/hooks/useRecentSearches";

export function HeroSearchSection() {
  const router = useRouter();
  const { searches, addSearch } = useRecentSearches();

  const handlePlayerFound = (player: RecentSearch) => {
    addSearch(player);
  };

  const handleRecentSelect = (search: RecentSearch) => {
    router.push(`/player/${search.accountId}`);
  };

  return (
    <div className="w-full max-w-md">
      <SearchBar onPlayerFound={handlePlayerFound} />
      <RecentSearches searches={searches} onSelect={handleRecentSelect} />
    </div>
  );
}
