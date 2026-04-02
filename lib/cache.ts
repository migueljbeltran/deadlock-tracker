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

