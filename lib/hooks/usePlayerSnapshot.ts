"use client";

import { useCallback, useEffect, useState } from "react";
import type { PlayerSnapshotResponse } from "@/lib/api";

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

export function usePlayerSnapshot({
  accountId,
  initialData,
}: UsePlayerSnapshotOptions): UsePlayerSnapshotResult {
  const [data, setData] = useState<PlayerSnapshotResponse | null>(initialData ?? null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [reloadToken, setReloadToken] = useState(0);
  const [fetchError, setFetchError] = useState<string | null>(null);

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
        const res = await fetch(`/api/player/${accountId}?v=${reloadToken}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const body = await res.json() as PlayerSnapshotResponse;
        if (controller.signal.aborted) return;
        setData(body);
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
