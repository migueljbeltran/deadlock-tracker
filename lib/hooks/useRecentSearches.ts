"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "dltracker-recent-searches";
const MAX_RECENT = 5;

export interface RecentSearch {
  accountId: number;
  name: string;
  avatar: string;
}

export function useRecentSearches() {
  const [searches, setSearches] = useState<RecentSearch[]>([]);

  // Read from localStorage on mount (client-only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSearches(JSON.parse(stored));
    } catch {
      // Ignore corrupted or unavailable storage
    }
  }, []);

  const addSearch = useCallback((search: RecentSearch) => {
    setSearches((prev) => {
      const filtered = prev.filter((s) => s.accountId !== search.accountId);
      const updated = [search, ...filtered].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Storage full or unavailable
      }
      return updated;
    });
  }, []);

  const clearSearches = useCallback(() => {
    setSearches([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  return { searches, addSearch, clearSearches };
}
