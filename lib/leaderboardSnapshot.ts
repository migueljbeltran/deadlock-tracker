import "server-only";

import type { DeadlockLeaderboardEntry } from "@/lib/api/types";
import type { DeadlockRegion } from "@/lib/api/deadlock";
import type { ResolvedAccount } from "@/lib/api/resolve";
import { getLeaderboard } from "@/lib/api/deadlock";
import { resolveAccountIds } from "@/lib/api/resolve";
import { cacheDelete, cacheGet, cacheSet, cacheSetIfNotExists, isCacheAvailable } from "@/lib/cache";
import logger from "@/lib/logger";

export interface ResolvedLeaderboardEntry extends DeadlockLeaderboardEntry {
  resolvedAccountId: number | null;
  confident: boolean;
}

interface ResolvedLeaderboardSnapshot {
  fetchedAt: string;
  entries: ResolvedLeaderboardEntry[];
}

const SNAPSHOT_TTL_SECONDS = 604800;
// 2-day freshness: leaderboard shifts daily but perfect real-time accuracy isn't critical
const SNAPSHOT_FRESHNESS_SECONDS = 172800;
const SNAPSHOT_LOCK_TTL_SECONDS = 300;

function getSnapshotKey(region: DeadlockRegion): string {
  return `leaderboard-snapshot:${region}:v1`;
}

function getSnapshotLockKey(region: DeadlockRegion): string {
  return `leaderboard-snapshot-refresh-lock:${region}`;
}

function isSnapshotStale(snapshot: ResolvedLeaderboardSnapshot): boolean {
  const fetchedAt = Date.parse(snapshot.fetchedAt);
  if (Number.isNaN(fetchedAt)) return true;
  return (Date.now() - fetchedAt) / 1000 >= SNAPSHOT_FRESHNESS_SECONDS;
}

async function buildResolvedLeaderboardSnapshot(region: DeadlockRegion): Promise<ResolvedLeaderboardSnapshot> {
  const entries = await getLeaderboard(region);
  const resolvedMap = await resolveAccountIds(entries).catch(() => new Map<number, ResolvedAccount>());
  const resolvedEntries = entries.map((entry, idx) => {
    const resolved = resolvedMap.get(idx);
    return {
      ...entry,
      resolvedAccountId: resolved?.accountId ?? (entry.possible_account_ids[0] ?? null),
      confident: resolved?.confident ?? (entry.possible_account_ids.length === 1),
    };
  });

  const snapshot: ResolvedLeaderboardSnapshot = {
    fetchedAt: new Date().toISOString(),
    entries: resolvedEntries,
  };

  await cacheSet(getSnapshotKey(region), snapshot, SNAPSHOT_TTL_SECONDS);
  logger.info({ region, entries: resolvedEntries.length }, "Resolved leaderboard snapshot rebuilt");
  return snapshot;
}

export async function getResolvedLeaderboard(region: DeadlockRegion): Promise<ResolvedLeaderboardEntry[]> {
  return (await getResolvedLeaderboardSnapshot(region)).entries;
}

export async function getResolvedLeaderboardSnapshot(region: DeadlockRegion): Promise<ResolvedLeaderboardSnapshot> {
  if (!isCacheAvailable()) {
    return buildResolvedLeaderboardSnapshot(region);
  }

  const key = getSnapshotKey(region);
  const cached = await cacheGet<ResolvedLeaderboardSnapshot>(key);
  if (!cached) {
    const lockAcquired = await cacheSetIfNotExists(getSnapshotLockKey(region), "1", SNAPSHOT_LOCK_TTL_SECONDS);
    if (!lockAcquired) {
      const liveEntries = await getLeaderboard(region);
      return {
        fetchedAt: new Date().toISOString(),
        entries: liveEntries.map((entry) => ({
          ...entry,
          resolvedAccountId: entry.possible_account_ids[0] ?? null,
          confident: entry.possible_account_ids.length === 1,
        })),
      };
    }

    try {
      return await buildResolvedLeaderboardSnapshot(region);
    } finally {
      await cacheDelete(getSnapshotLockKey(region));
    }
  }

  if (!isSnapshotStale(cached)) {
    return cached;
  }

  const lockAcquired = await cacheSetIfNotExists(getSnapshotLockKey(region), "1", SNAPSHOT_LOCK_TTL_SECONDS);
  if (!lockAcquired) {
    logger.info({ region }, "Resolved leaderboard snapshot stale; serving stale data");
    return cached;
  }

  try {
    return await buildResolvedLeaderboardSnapshot(region);
  } catch (error) {
    logger.warn({ region, error }, "Resolved leaderboard snapshot rebuild failed; serving stale data");
    return cached;
  } finally {
    await cacheDelete(getSnapshotLockKey(region));
  }
}
