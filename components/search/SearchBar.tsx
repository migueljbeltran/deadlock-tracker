"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SearchResults, type SearchResult } from "./SearchResults";
import type { RecentSearch } from "@/lib/hooks/useRecentSearches";

interface SearchBarProps {
  onPlayerFound?: (player: RecentSearch) => void;
}

export function SearchBar({ onPlayerFound }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownMaxH, setDropdownMaxH] = useState<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Cap dropdown height to viewport bottom
  useEffect(() => {
    if (!showDropdown || !dropdownRef.current) return;
    function recalc() {
      if (!dropdownRef.current) return;
      const rect = dropdownRef.current.getBoundingClientRect();
      const available = window.innerHeight - rect.top - 16; // 16px breathing room
      setDropdownMaxH(Math.max(available, 120));
    }
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [showDropdown, results, isLoading, error]);

  const handleSearch = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError(null);
    setResults([]);
    setShowDropdown(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (data.success && data.results?.length > 0) {
        setResults(data.results);
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

  const handleSelect = (selected: SearchResult) => {
    setShowDropdown(false);
    setQuery("");

    const name = selected.source === "steam" ? selected.name : selected.accountName;
    const avatar = selected.source === "steam" ? selected.avatar : "";
    onPlayerFound?.({
      accountId: selected.accountId,
      name,
      avatar,
    });
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
        Search by Account ID, Steam ID, vanity URL, or profile link
      </p>

      {/* Dropdown Results */}
      {showDropdown && (isLoading || results.length > 0 || error) && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-y-auto rounded-md glass-panel shadow-[var(--shadow-depth-md)]"
          style={dropdownMaxH ? { maxHeight: dropdownMaxH } : undefined}
        >
          <SearchResults
            isLoading={isLoading}
            results={results}
            error={error}
            onSelect={handleSelect}
          />
        </div>
      )}
    </div>
  );
}
