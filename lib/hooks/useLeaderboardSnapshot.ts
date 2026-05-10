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

interface UseLeaderboardSnapshotOptions {
  initialRegion?: DeadlockRegion;
  initialSnapshot?: LeaderboardSnapshot | null;
}

type RequestState = "loading" | "success" | "error";

const MAX_FETCH_ATTEMPTS = 3;
const RETRY_DELAY_MS = 700;

function isUsableSnapshot(value: LeaderboardSnapshot | null): value is LeaderboardSnapshot {
  return Array.isArray(value?.entries);
}

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timeout = window.setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      window.clearTimeout(timeout);
      resolve();
    }, { once: true });
  });
}

export function useLeaderboardSnapshot(
  region: DeadlockRegion,
  page = 1,
  options: UseLeaderboardSnapshotOptions = {},
): UseLeaderboardSnapshotResult {
  const hasInitialSnapshot = options.initialRegion === region && isUsableSnapshot(options.initialSnapshot ?? null);
  const [snapshot, setSnapshot] = useState<LeaderboardSnapshot | null>(
    hasInitialSnapshot ? options.initialSnapshot ?? null : null,
  );
  const [requestState, setRequestState] = useState<RequestState>(
    hasInitialSnapshot ? "success" : "loading",
  );
  const [loadedRegion, setLoadedRegion] = useState<DeadlockRegion | null>(
    hasInitialSnapshot ? region : null,
  );
  const [loadedPage, setLoadedPage] = useState<number | null>(
    hasInitialSnapshot ? page : null,
  );

  useEffect(() => {
    if (loadedRegion === region && loadedPage === page && (snapshot || requestState === "error")) return;

    const controller = new AbortController();

    async function load() {
      setRequestState("loading");

      for (let attempt = 0; attempt < MAX_FETCH_ATTEMPTS; attempt++) {
        try {
          const response = await fetch(`/api/leaderboard?region=${region}&page=${page}`, { signal: controller.signal });
          if (!response.ok) throw new Error("Leaderboard request failed");

          const data = await response.json() as LeaderboardSnapshot;
          if (controller.signal.aborted) return;

          if (!isUsableSnapshot(data)) {
            throw new Error("Leaderboard payload missing entries");
          }

          setSnapshot(data);
          setRequestState("success");
          setLoadedRegion(region);
          setLoadedPage(page);
          return;
        } catch {
          if (controller.signal.aborted) return;
          if (attempt < MAX_FETCH_ATTEMPTS - 1) {
            await delay(RETRY_DELAY_MS, controller.signal);
            if (controller.signal.aborted) return;
            continue;
          }

          setRequestState("error");
          setLoadedRegion(region);
          setLoadedPage(page);
        }
      }
    }

    void load();

    return () => controller.abort();
  }, [page, region, loadedPage, loadedRegion, requestState, snapshot]);

  return {
    snapshot,
    isLoading: loadedRegion !== region || loadedPage !== page || requestState === "loading",
    hasError: loadedRegion === region && loadedPage === page && requestState === "error",
  };
}
