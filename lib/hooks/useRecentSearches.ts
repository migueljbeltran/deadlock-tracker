"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "dltracker-recent-searches";
const MAX_RECENT = 5;

export interface RecentSearch {
  accountId: number;
  name: string;
  avatar: string;
}

// Listeners notified when localStorage changes within this tab
let listeners: Array<() => void> = [];
function emitChange() {
  for (const listener of listeners) listener();
}

function subscribe(callback: () => void) {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

// Cache the parsed result so useSyncExternalStore gets a stable reference
let cachedRaw: string | null = null;
let cachedParsed: RecentSearch[] = [];

function getSnapshot(): RecentSearch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedParsed = raw ? JSON.parse(raw) : [];
    }
    return cachedParsed;
  } catch {
    return cachedParsed;
  }
}

function getServerSnapshot(): RecentSearch[] {
  return cachedParsed;
}

export function useRecentSearches() {
  const searches = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addSearch = useCallback((search: RecentSearch) => {
    const current = getSnapshot();
    const filtered = current.filter((s) => s.accountId !== search.accountId);
    const updated = [search, ...filtered].slice(0, MAX_RECENT);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Storage full or unavailable
    }
    emitChange();
  }, []);

  const clearSearches = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    emitChange();
  }, []);

  return { searches, addSearch, clearSearches };
}
