import "server-only";

import { Redis } from "@upstash/redis";
import { getOptionalServerEnv } from "@/lib/env";
import logger from "@/lib/logger";

const PREFIX = "dltracker:cache:";

let redis: Redis | null = null;
let redisRetryAt = 0;
const REDIS_RETRY_DELAY_MS = 30_000;

function recordCacheFailure(key: string, operation: string) {
  redisRetryAt = Date.now() + REDIS_RETRY_DELAY_MS;
  logger.warn({ key, operation }, "Redis cache unavailable; using upstream fallback");
}

export interface CachedSnapshot<T> {
  fetchedAt: string;
  data: T;
}

interface CacheSnapshotOptions<T> {
  key: string;
  label: string;
  ttlSeconds: number;
  freshnessSeconds: number;
  lockTtlSeconds: number;
  builder: () => Promise<T>;
  onLockedMiss?: () => Promise<T | null> | T | null;
}

function getRedis(): Redis | null {
  if (Date.now() < redisRetryAt) return null;
  if (redis) return redis;

  const url = getOptionalServerEnv("UPSTASH_REDIS_REST_URL");
  const token = getOptionalServerEnv("UPSTASH_REDIS_REST_TOKEN");

  if (!url || !token) return null;

  // Redis owns its TTLs and lock semantics. Persistently caching its REST
  // commands in Next can replay old GET/SET-NX results and adds ISR writes.
  // Public snapshots use a bounded outer cache instead (publicSnapshots.ts).
  redis = new Redis({ url, token, cache: "no-store", retry: { retries: 0 }, signal: () => AbortSignal.timeout(2000) });
  return redis;
}

export function isCacheAvailable(): boolean {
  return getRedis() != null;
}

/**
 * Get a cached value by key. Returns null on miss or Redis error.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;

  try {
    const value = await client.get<T>(`${PREFIX}${key}`);
    if (value != null) {
      logger.debug({ key }, "Cache hit");
    }
    return value ?? null;
  } catch {
    recordCacheFailure(key, "get");
    return null;
  }
}

/**
 * Store a value in cache with a TTL in seconds. Silently swallows errors.
 */
export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    await client.set(`${PREFIX}${key}`, value, { ex: ttlSeconds });
  } catch {
    recordCacheFailure(key, "set");
  }
}

/**
 * Store a value only if the key does not already exist.
 * true = acquired, false = already exists, null = cache unavailable.
 */
export async function cacheSetIfNotExists<T>(key: string, value: T, ttlSeconds: number): Promise<boolean | null> {
  const client = getRedis();
  if (!client) return null;

  try {
    const result = await client.set(`${PREFIX}${key}`, value, { ex: ttlSeconds, nx: true });
    return result === "OK";
  } catch {
    recordCacheFailure(key, "set-nx");
    return null;
  }
}

/**
 * Delete a cached value. Silently swallows errors.
 */
export async function cacheDelete(key: string, options: { bypassBackoff?: boolean } = {}): Promise<void> {
  // Confirmed-owned locks still need cleanup after a snapshot SET fails.
  // Reuse the initialized client for that one bounded cleanup attempt; ordinary
  // cache operations continue to respect the outage circuit breaker.
  const client = options.bypassBackoff ? redis : getRedis();
  if (!client) return;

  try {
    await client.del(`${PREFIX}${key}`);
  } catch {
    recordCacheFailure(key, "delete");
  }
}

function isCachedSnapshotStale<T>(
  snapshot: CachedSnapshot<T>,
  freshnessSeconds: number,
): boolean {
  const fetchedAt = Date.parse(snapshot.fetchedAt);
  if (Number.isNaN(fetchedAt)) return true;
  return (Date.now() - fetchedAt) / 1000 >= freshnessSeconds;
}

/**
 * Read-through cache for expensive upstream calls.
 * Serves stale cached data when rebuilds fail and uses a short lock to avoid
 * thundering herd rebuilds across serverless instances.
 */
export async function cacheGetOrBuildSnapshot<T>({
  key,
  label,
  ttlSeconds,
  freshnessSeconds,
  lockTtlSeconds,
  builder,
  onLockedMiss,
}: CacheSnapshotOptions<T>): Promise<CachedSnapshot<T> | null> {
  if (!isCacheAvailable()) {
    return {
      fetchedAt: new Date().toISOString(),
      data: await builder(),
    };
  }

  const cached = await cacheGet<CachedSnapshot<T>>(key);
  const lockKey = `${key}:refresh-lock`;

  if (!cached) {
    const lockAcquired = await cacheSetIfNotExists(lockKey, "1", lockTtlSeconds);
    if (lockAcquired === false) {
      logger.info({ key: label }, "Cache snapshot cold miss locked");
      const fallback = onLockedMiss ? await onLockedMiss() : null;
      return fallback == null
        ? null
        : { fetchedAt: new Date().toISOString(), data: fallback };
    }

    try {
      const snapshot = {
        fetchedAt: new Date().toISOString(),
        data: await builder(),
      };
      await cacheSet(key, snapshot, ttlSeconds);
      logger.info({ key: label }, "Cache snapshot built on miss");
      return snapshot;
    } finally {
      if (lockAcquired === true) await cacheDelete(lockKey, { bypassBackoff: true });
    }
  }

  if (!isCachedSnapshotStale(cached, freshnessSeconds)) {
    return cached;
  }

  const lockAcquired = await cacheSetIfNotExists(lockKey, "1", lockTtlSeconds);
  if (lockAcquired !== true) {
    logger.info({ key: label }, "Cache snapshot stale; serving stale data");
    return cached;
  }

  try {
    const snapshot = {
      fetchedAt: new Date().toISOString(),
      data: await builder(),
    };
    await cacheSet(key, snapshot, ttlSeconds);
    logger.info({ key: label }, "Cache snapshot rebuilt");
    return snapshot;
  } catch (error) {
    logger.warn({ key: label, error }, "Cache snapshot rebuild failed; serving stale data");
    return cached;
  } finally {
    await cacheDelete(lockKey, { bypassBackoff: true });
  }
}

