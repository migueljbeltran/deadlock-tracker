import "server-only";

import { Redis } from "@upstash/redis";
import logger from "@/lib/logger";

const PREFIX = "dltracker:cache:";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  redis = new Redis({ url, token, cache: "force-cache" });
  return redis;
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
  } catch (err) {
    logger.warn({ err, key }, "Cache get failed");
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
  } catch (err) {
    logger.warn({ err, key }, "Cache set failed");
  }
}

/**
 * Delete one or more cached keys. Silently swallows errors.
 */
export async function cacheDel(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const client = getRedis();
  if (!client) return;

  try {
    await client.del(...keys.map((k) => `${PREFIX}${k}`));
  } catch (err) {
    logger.warn({ err, keys }, "Cache del failed");
  }
}

/**
 * Batch-get multiple cached values in a single Redis round-trip.
 * Returns an array of results in the same order as the input keys (null for misses).
 */
export async function cacheMget<T>(keys: string[]): Promise<(T | null)[]> {
  if (keys.length === 0) return [];
  const client = getRedis();
  if (!client) return keys.map(() => null);

  try {
    const prefixedKeys = keys.map((k) => `${PREFIX}${k}`);
    const results = await client.mget<(T | null)[]>(...prefixedKeys);
    return results;
  } catch (err) {
    logger.warn({ err, count: keys.length }, "Cache mget failed");
    return keys.map(() => null);
  }
}

/**
 * Batch-set multiple values in a single Redis round-trip using a pipeline.
 * Silently swallows errors.
 */
export async function cacheMset(
  entries: { key: string; value: unknown; ttlSeconds: number }[],
): Promise<void> {
  if (entries.length === 0) return;
  const client = getRedis();
  if (!client) return;

  try {
    const pipeline = client.pipeline();
    for (const { key, value, ttlSeconds } of entries) {
      pipeline.set(`${PREFIX}${key}`, value, { ex: ttlSeconds });
    }
    await pipeline.exec();
  } catch (err) {
    logger.warn({ err, count: entries.length }, "Cache mset pipeline failed");
  }
}
