import "server-only";
import { unstable_cache } from "next/cache";

import type {
  DeadlockApiInfo,
  DeadlockHeroAnalytics,
  DeadlockItem,
  DeadlockItemStats,
} from "@/lib/api/types";
import { getApiInfo, getHeroAnalytics, getItemStats, getItems } from "@/lib/api/deadlock";
import { cacheDelete, cacheGet, cacheSet, cacheSetIfNotExists, isCacheAvailable } from "@/lib/cache";
import {
  DEFAULT_ANALYTICS_TIME_RANGE,
  type AnalyticsTimeRange,
} from "@/lib/analyticsTimeRange";
import logger from "@/lib/logger";

interface PublicSnapshot<T> {
  fetchedAt: string;
  data: T;
}

const SNAPSHOT_TTL_SECONDS = 604800;
// Hero/item data only changes on game patches (~every 2 weeks) — refresh weekly, not daily
const SNAPSHOT_FRESHNESS_SECONDS = 604800;
const ANALYTICS_SNAPSHOT_FRESHNESS_SECONDS = 3600;
const SNAPSHOT_LOCK_TTL_SECONDS = 300;

function compactItemStats(stats: DeadlockItemStats[]): DeadlockItemStats[] {
  return stats.map((stat) => ({
    item_id: stat.item_id,
    bucket: stat.bucket,
    wins: stat.wins,
    matches: stat.matches,
  }) as DeadlockItemStats);
}

function compactHeroAnalytics(analytics: DeadlockHeroAnalytics[]): DeadlockHeroAnalytics[] {
  const compact = analytics.map((entry) => ({
    hero_id: entry.hero_id,
    bucket: entry.bucket,
    wins: entry.wins,
    losses: entry.losses,
    matches: entry.matches,
    total_kills: entry.total_kills,
    total_deaths: entry.total_deaths,
    total_assists: entry.total_assists,
    total_net_worth: entry.total_net_worth,
    total_last_hits: entry.total_last_hits,
    total_denies: entry.total_denies,
    total_player_damage: entry.total_player_damage,
    total_player_damage_taken: entry.total_player_damage_taken,
    total_boss_damage: entry.total_boss_damage,
    total_creep_damage: entry.total_creep_damage,
    total_neutral_damage: entry.total_neutral_damage,
    total_shots_hit: entry.total_shots_hit,
    total_shots_missed: entry.total_shots_missed,
    total_max_health: entry.total_max_health,
  }));
  // All views filter/display rank tiers, not individual badge subranks.
  // Sum additive metrics into those same tiers to shrink every snapshot.
  const tiers = new Map<string, DeadlockHeroAnalytics>();
  const totals = [
    "wins", "losses", "matches", "total_kills", "total_deaths", "total_assists",
    "total_net_worth", "total_last_hits", "total_denies", "total_player_damage",
    "total_player_damage_taken", "total_boss_damage", "total_creep_damage",
    "total_neutral_damage", "total_shots_hit", "total_shots_missed", "total_max_health",
  ] as const;
  for (const entry of compact) {
    const bucket = Math.floor(entry.bucket / 10) * 10;
    const key = `${entry.hero_id}:${bucket}`;
    const existing = tiers.get(key);
    if (existing) {
      for (const field of totals) existing[field] += entry[field];
    } else {
      tiers.set(key, { ...entry, bucket });
    }
  }
  return [...tiers.values()];
}

function compactShopableItem(item: DeadlockItem): DeadlockItem {
  return {
    id: item.id,
    class_name: item.class_name,
    name: item.name,
    image: item.image,
    image_webp: item.image_webp,
    shop_image: item.shop_image,
    shop_image_webp: item.shop_image_webp,
    cost: item.cost,
    item_tier: item.item_tier,
    item_slot_type: item.item_slot_type,
    activation: item.activation,
    shopable: item.shopable,
  };
}

function isSnapshotStale<T>(snapshot: PublicSnapshot<T>, freshnessSeconds: number): boolean {
  const fetchedAt = Date.parse(snapshot.fetchedAt);
  if (Number.isNaN(fetchedAt)) return true;
  return (Date.now() - fetchedAt) / 1000 >= freshnessSeconds;
}

const pendingSnapshots = new Map<string, Promise<PublicSnapshot<unknown>>>();

function getOrBuildSnapshot<T>(
  key: string,
  label: string,
  builder: () => Promise<T>,
  freshnessSeconds = SNAPSHOT_FRESHNESS_SECONDS,
): Promise<PublicSnapshot<T>> {
  // Only a finite set of public datasets enters Next's persistent cache.
  // Redis commands inside this boundary always reach Redis, while ISR pages
  // can reuse a compact snapshot without becoming dynamic on every visit.
  return unstable_cache(async () => {
    const pending = pendingSnapshots.get(key);
    if (pending) return pending as Promise<PublicSnapshot<T>>;
    const promise = buildPublicSnapshot(key, label, builder, freshnessSeconds);
    pendingSnapshots.set(key, promise);
    try {
      return await promise;
    } finally {
      pendingSnapshots.delete(key);
    }
  }, ["public-dataset-v5", key], { revalidate: freshnessSeconds })();
}

async function buildPublicSnapshot<T>(
  key: string,
  label: string,
  builder: () => Promise<T>,
  freshnessSeconds = SNAPSHOT_FRESHNESS_SECONDS,
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
      // A different instance is building this dataset. Do not duplicate an
      // expensive analytics rebuild merely because the cache is still cold.
      throw new Error(`${label} is refreshing. Please try again shortly.`);
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

  if (!isSnapshotStale(cached, freshnessSeconds)) {
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

export async function getHeroAnalyticsSnapshot(
  timeRange: AnalyticsTimeRange = DEFAULT_ANALYTICS_TIME_RANGE,
): Promise<PublicSnapshot<DeadlockHeroAnalytics[]>> {
  return getOrBuildSnapshot(
    `public-snapshot:hero-analytics:${timeRange}:v4`,
    `hero-analytics-${timeRange}`,
    async () => compactHeroAnalytics(await getHeroAnalytics(timeRange)),
    ANALYTICS_SNAPSHOT_FRESHNESS_SECONDS,
  );
}

export async function getItemStatsSnapshot(
  timeRange: AnalyticsTimeRange = DEFAULT_ANALYTICS_TIME_RANGE,
): Promise<PublicSnapshot<DeadlockItemStats[]>> {
  return getOrBuildSnapshot(
    `public-snapshot:item-stats:${timeRange}:v3`,
    `item-stats-${timeRange}`,
    async () => compactItemStats(await getItemStats(undefined, timeRange)),
    ANALYTICS_SNAPSHOT_FRESHNESS_SECONDS,
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
    "public-snapshot:shopable-items:v2",
    "shopable-items",
    async () => {
      const items = await getItems();
      return items
        .filter((item) => item.shopable === true)
        .map(compactShopableItem);
    },
  );
}
