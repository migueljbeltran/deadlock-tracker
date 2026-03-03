"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SearchResults, type SearchResultPlayer } from "./SearchResults";
import type { RecentSearch } from "@/lib/hooks/useRecentSearches";

interface SearchBarProps {
  onPlayerFound?: (player: RecentSearch) => void;
}

export function SearchBar({ onPlayerFound }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [player, setPlayer] = useState<SearchResultPlayer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError(null);
    setPlayer(null);
    setShowDropdown(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (data.success) {
        setPlayer(data.player);
      } else {
        setError(data.error || "No player found");
      }
    } catch {
      setError("Search failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleSelect = (selected: SearchResultPlayer) => {
    onPlayerFound?.({
      accountId: selected.accountId,
      name: selected.name,
      avatar: selected.avatar,
    });
    setShowDropdown(false);
    setQuery("");
    router.push(`/player/${selected.accountId}`);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            type="search"
            placeholder="Seek a soul..."
            className="pl-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={isLoading || !query.trim()}>
          Consult
        </Button>
      </form>
      <p className="mt-2 text-sm text-text-muted">
        Search by Steam ID, vanity URL, or profile link
      </p>

      {/* Dropdown Results */}
      {showDropdown && (isLoading || player || error) && (
        <div className="absolute left-0 right-0 top-12 z-20 mt-1 overflow-hidden rounded border border-border-subtle bg-surface shadow-lg">
          <SearchResults
            isLoading={isLoading}
            player={player}
            error={error}
            onSelect={handleSelect}
          />
        </div>
      )}
    </div>
  );
}
