import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getOptionalServerEnv } from "@/lib/env";
import logger from "@/lib/logger";

const RATE_LIMITS = {
  search: { requests: 10, window: "60 s" },
  playerApi: { requests: 60, window: "60 s" },
  leaderboardApi: { requests: 30, window: "60 s" },
  healthApi: { requests: 120, window: "60 s" },
  playerRefresh: { requests: 10, window: "60 s" },
} as const;

type RateLimitName = keyof typeof RATE_LIMITS;

let redis: Redis | null | undefined;
const ratelimits = new Map<RateLimitName, Ratelimit>();
const FALLBACK_WINDOW_MS = 60_000;
const MAX_FALLBACK_IDENTIFIERS = 10_000;
const REDIS_RETRY_DELAY_MS = 30_000;
const fallbackCounts = new Map<string, number>();
let fallbackReset = 0;
let redisRetryAt = 0;

// Per-instance protection when distributed Redis limiting is unavailable.
// Bound storage and reject new identifiers at capacity rather than evicting
// counters that an attacker could repeatedly reset.
function checkFallbackRateLimit(name: RateLimitName, identifier: string) {
  const now = Date.now();
  if (now >= fallbackReset) {
    fallbackCounts.clear();
    fallbackReset = (Math.floor(now / FALLBACK_WINDOW_MS) + 1) * FALLBACK_WINDOW_MS;
  }
  const key = `${name}:${identifier}`;
  const count = fallbackCounts.get(key) ?? 0;
  if (count >= RATE_LIMITS[name].requests || (count === 0 && fallbackCounts.size >= MAX_FALLBACK_IDENTIFIERS)) {
    return { success: false, reset: fallbackReset };
  }
  fallbackCounts.set(key, count + 1);
  return { success: true, reset: fallbackReset };
}

function recordRedisFailure(name: RateLimitName) {
  redisRetryAt = Date.now() + REDIS_RETRY_DELAY_MS;
  logger.warn({ name }, "Redis rate limiting unavailable; using per-instance fallback");
}

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;

  const url = getOptionalServerEnv("UPSTASH_REDIS_REST_URL");
  const token = getOptionalServerEnv("UPSTASH_REDIS_REST_TOKEN");

  if (!url || !token) {
    // Use bounded per-instance limiting without Redis.
    redis = null;
    return null;
  }

  redis = new Redis({ url, token, cache: "no-store" });
  return redis;
}

function getRatelimit(name: RateLimitName): Ratelimit | null {
  const client = getRedis();
  if (!client) return null;

  const existing = ratelimits.get(name);
  if (existing) return existing;

  const config = RATE_LIMITS[name];
  const ratelimit = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    analytics: false,
    prefix: `dltracker:ratelimit:${name}`,
  });
  ratelimits.set(name, ratelimit);
  return ratelimit;
}

export function getClientIp(request: NextRequest): string {
  return request.headers.get("x-real-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "127.0.0.1";
}

export function getRetryAfterSeconds(reset?: number): string | undefined {
  if (!reset) return undefined;
  return String(Math.max(1, Math.ceil((reset - Date.now()) / 1000)));
}

export function rateLimitResponse(reset?: number): NextResponse {
  const retryAfter = getRetryAfterSeconds(reset);
  return NextResponse.json(
    { success: false, error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: { "Cache-Control": "no-store", ...(retryAfter ? { "Retry-After": retryAfter } : {}) },
    },
  );
}

export async function checkRateLimit(
  name: RateLimitName,
  identifier: string,
): Promise<{ success: boolean; reset?: number }> {
  if (Date.now() < redisRetryAt) return checkFallbackRateLimit(name, identifier);

  try {
    const ratelimit = getRatelimit(name);
    if (!ratelimit) return checkFallbackRateLimit(name, identifier);
    const result = await ratelimit.limit(identifier);
    // The SDK returns success on its own timeout instead of throwing.
    if (result.reason === "timeout") {
      recordRedisFailure(name);
      return checkFallbackRateLimit(name, identifier);
    }
    return { success: result.success, reset: result.reset };
  } catch {
    recordRedisFailure(name);
    return checkFallbackRateLimit(name, identifier);
  }
}

export async function checkRequestRateLimit(
  request: NextRequest,
  name: RateLimitName,
): Promise<{ success: boolean; reset?: number; ip: string }> {
  const ip = getClientIp(request);
  const result = await checkRateLimit(name, ip);
  return { ...result, ip };
}
