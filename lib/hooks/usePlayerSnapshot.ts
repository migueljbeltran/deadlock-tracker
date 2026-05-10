"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PlayerSnapshot, PlayerSnapshotResponse } from "@/lib/api";

interface UsePlayerSnapshotOptions {
  accountId: number;
  initialData?: PlayerSnapshotResponse;
}

interface UsePlayerSnapshotResult {
  data: PlayerSnapshotResponse | null;
  isLoading: boolean;
  fetchError: string | null;
  refetch: () => void;
}

function mergeSnapshotStatus(snapshot: PlayerSnapshot): PlayerSnapshot["status"] {
  return snapshot.heroStats.length > 0
    && snapshot.matches.length > 0
    && snapshot.matchDataIncomplete !== true
    && snapshot.metrics != null
    ? "complete"
    : snapshot.status;
}

function preserveUsableSnapshotSections(
  previous: PlayerSnapshotResponse | null,
  next: PlayerSnapshotResponse,
): PlayerSnapshotResponse {
  if (!previous?.success || !next.success) return next;

  const previousMatches = previous.snapshot.matches;
  const nextMatches = next.snapshot.matches;
  const previousMatchesUsable = previousMatches.length > 0 && previous.snapshot.matchDataIncomplete !== true;
  const nextMatchesDegraded = next.snapshot.matchDataIncomplete === true || nextMatches.length === 0;
  const preserveMatches = previousMatchesUsable && nextMatchesDegraded;

  const preserveHeroStats = previous.snapshot.heroStats.length > 0 && next.snapshot.heroStats.length === 0;
  const preserveMetrics = previous.snapshot.metrics != null && next.snapshot.metrics == null;

  if (!preserveMatches && !preserveHeroStats && !preserveMetrics) return next;

  const snapshot = {
    ...next.snapshot,
    heroStats: preserveHeroStats ? previous.snapshot.heroStats : next.snapshot.heroStats,
    matches: preserveMatches ? previousMatches : next.snapshot.matches,
    matchDataIncomplete: preserveMatches ? false : next.snapshot.matchDataIncomplete,
    metrics: preserveMetrics ? previous.snapshot.metrics : next.snapshot.metrics,
    rankEstimate: preserveMatches
      ? next.snapshot.rankEstimate ?? previous.snapshot.rankEstimate
      : next.snapshot.rankEstimate,
  };
  const status = mergeSnapshotStatus(snapshot);

  return {
    ...next,
    snapshot: {
      ...snapshot,
      status,
    },
    isStale: next.isStale && !preserveMatches && !preserveHeroStats && !preserveMetrics,
    shouldRefresh: next.shouldRefresh && (
      status === "partial"
      || snapshot.matchDataIncomplete === true
      || snapshot.heroStats.length === 0
      || snapshot.metrics == null
    ),
  };
}

function hasDegradedSnapshotSections(
  current: PlayerSnapshotResponse | null,
  body: PlayerSnapshotResponse,
): boolean {
  if (!current?.success || !body.success) return false;

  return (
    (current.snapshot.matches.length > 0 && (body.snapshot.matchDataIncomplete === true || body.snapshot.matches.length === 0))
    || (current.snapshot.heroStats.length > 0 && body.snapshot.heroStats.length === 0)
    || (current.snapshot.metrics != null && body.snapshot.metrics == null)
  );
}

export function usePlayerSnapshot({
  accountId,
  initialData,
}: UsePlayerSnapshotOptions): UsePlayerSnapshotResult {
  const [data, setData] = useState<PlayerSnapshotResponse | null>(initialData ?? null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [reloadToken, setReloadToken] = useState(0);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const latestDataRef = useRef<PlayerSnapshotResponse | null>(initialData ?? null);

  useEffect(() => {
    latestDataRef.current = data;
  }, [data]);

  const refetch = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  useEffect(() => {
    // Skip the initial fetch when the server provided seeded data; subsequent
    // refetches (manual refresh, recovery flow) still trigger the API call.
    if (initialData && reloadToken === 0) {
      return;
    }

    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setFetchError(null);

      try {
        let latestBody: PlayerSnapshotResponse | null = null;

        for (let attempt = 0; attempt < 4; attempt++) {
          const res = await fetch(`/api/player/${accountId}?v=${reloadToken}&attempt=${attempt}`, {
            cache: "no-store",
            signal: controller.signal,
          });
          const body = await res.json() as PlayerSnapshotResponse;
          if (controller.signal.aborted) return;

          latestBody = body;
          const current = latestDataRef.current;
          if (hasDegradedSnapshotSections(current, body)) {
            break;
          }

          if (!body.success || !body.shouldRefresh || body.snapshot.matches.length > 0) {
            break;
          }

          await new Promise((resolve) => window.setTimeout(resolve, 700));
          if (controller.signal.aborted) return;
        }

        if (latestBody) {
          setData((current) => preserveUsableSnapshotSections(current, latestBody));
        }
      } catch {
        if (controller.signal.aborted) return;
        setFetchError("Failed to load player data.");
      } finally {
        if (controller.signal.aborted) return;
        setIsLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [accountId, reloadToken, initialData]);

  return {
    data,
    isLoading,
    fetchError,
    refetch,
  };
}
