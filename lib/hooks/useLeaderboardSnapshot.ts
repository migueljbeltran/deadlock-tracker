"use client";

import { useEffect, useState } from "react";
import type { DeadlockRegion } from "@/lib/api";
import type { ResolvedLeaderboardEntry } from "@/lib/leaderboardSnapshot";

export interface LeaderboardSnapshot {
  fetchedAt: string;
  entries: ResolvedLeaderboardEntry[];
}

interface UseLeaderboardSnapshotResult {
  snapshot: LeaderboardSnapshot | null;
  isLoading: boolean;
  hasError: boolean;
}

export function useLeaderboardSnapshot(region: DeadlockRegion): UseLeaderboardSnapshotResult {
  const [snapshot, setSnapshot] = useState<LeaderboardSnapshot | null>(null);
  const [hasError, setHasError] = useState(false);
  const [loadedRegion, setLoadedRegion] = useState<DeadlockRegion | null>(null);

  // Derived: loading whenever the fetched region doesn't match the requested one.
  // Avoids synchronous setState at the top of the effect.
  const isLoading = loadedRegion !== region;

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/leaderboard?region=${region}`, { signal: controller.signal })
      .then((r) => r.json() as Promise<LeaderboardSnapshot>)
      .then((data) => {
        if (!controller.signal.aborted) {
          setSnapshot(data);
          setHasError(false);
          setLoadedRegion(region);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setHasError(true);
          setLoadedRegion(region);
        }
      });

    return () => controller.abort();
  }, [region]);

  return {
    snapshot,
    isLoading,
    hasError,
  };
}
