import "server-only";

import type {
  DeadlockApiInfo,
  DeadlockHeroAnalytics,
  DeadlockItem,
  DeadlockItemStats,
} from "@/lib/api/types";
import { getApiInfo, getHeroAnalytics, getItemStats, getItems } from "@/lib/api/deadlock";
import { cacheDelete, cacheGet, cacheSet, cacheSetIfNotExists, isCacheAvailable } from "@/lib/cache";
import logger from "@/lib/logger";

interface PublicSnapshot<T> {
  fetchedAt: string;
  data: T;
}

const SNAPSHOT_TTL_SECONDS = 604800;
const SNAPSHOT_FRESHNESS_SECONDS = 86400;
const SNAPSHOT_LOCK_TTL_SECONDS = 300;

function isSnapshotStale<T>(snapshot: PublicSnapshot<T>): boolean {
  const fetchedAt = Date.parse(snapshot.fetchedAt);
  if (Number.isNaN(fetchedAt)) return true;
  return (Date.now() - fetchedAt) / 1000 >= SNAPSHOT_FRESHNESS_SECONDS;
}

async function getOrBuildSnapshot<T>(
  key: string,
  label: string,
  builder: () => Promise<T>,
): Promise<PublicSnapshot<T>> {
  if (!isCacheAvailable()) {
    return {
      fetchedAt: new Date().toISOString(),
      data: await builder(),
    };
  }

  const cached = await cacheGet<PublicSnapshot<T>>(key);
  const lockKey = `${key}:refresh-lock`;

  if (!cached) {
    const lockAcquired = await cacheSetIfNotExists(lockKey, "1", SNAPSHOT_LOCK_TTL_SECONDS);
    if (!lockAcquired) {
      return {
        fetchedAt: new Date().toISOString(),
        data: await builder(),
      };
    }

    try {
      const snapshot = {
        fetchedAt: new Date().toISOString(),
        data: await builder(),
      };
      await cacheSet(key, snapshot, SNAPSHOT_TTL_SECONDS);
      logger.info({ key: label }, "Public snapshot built on miss");
      return snapshot;
    } finally {
      await cacheDelete(lockKey);
    }
  }

  if (!isSnapshotStale(cached)) {
    return cached;
  }

  const lockAcquired = await cacheSetIfNotExists(lockKey, "1", SNAPSHOT_LOCK_TTL_SECONDS);
  if (!lockAcquired) {
    logger.info({ key: label }, "Public snapshot stale; serving stale data");
    return cached;
  }

  try {
    const snapshot = {
      fetchedAt: new Date().toISOString(),
      data: await builder(),
    };
    await cacheSet(key, snapshot, SNAPSHOT_TTL_SECONDS);
    logger.info({ key: label }, "Public snapshot rebuilt");
    return snapshot;
  } catch (error) {
    logger.warn({ key: label, error }, "Public snapshot rebuild failed; serving stale data");
    return cached;
  } finally {
    await cacheDelete(lockKey);
  }
}

export async function getHeroAnalyticsSnapshot(): Promise<PublicSnapshot<DeadlockHeroAnalytics[]>> {
  return getOrBuildSnapshot(
    "public-snapshot:hero-analytics:v1",
    "hero-analytics",
    getHeroAnalytics,
  );
}

export async function getItemStatsSnapshot(): Promise<PublicSnapshot<DeadlockItemStats[]>> {
  return getOrBuildSnapshot(
    "public-snapshot:item-stats:v1",
    "item-stats",
    getItemStats,
  );
}

export async function getApiInfoSnapshot(): Promise<PublicSnapshot<DeadlockApiInfo | null>> {
  return getOrBuildSnapshot(
    "public-snapshot:api-info:v1",
    "api-info",
    async () => getApiInfo().catch(() => null),
  );
}

export async function getShopableItemsSnapshot(): Promise<PublicSnapshot<DeadlockItem[]>> {
  return getOrBuildSnapshot(
    "public-snapshot:shopable-items:v1",
    "shopable-items",
    async () => {
      const items = await getItems();
      return items.filter((item) => item.shopable === true);
    },
  );
}
