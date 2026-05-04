import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getOptionalServerEnv } from "@/lib/env";

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

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;

  const url = getOptionalServerEnv("UPSTASH_REDIS_REST_URL");
  const token = getOptionalServerEnv("UPSTASH_REDIS_REST_TOKEN");

  if (!url || !token) {
    // No-op fallback for local dev without Redis
    redis = null;
    return null;
  }

  redis = new Redis({ url, token });
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
    analytics: true,
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
      headers: retryAfter ? { "Retry-After": retryAfter } : {},
    },
  );
}

export async function checkRateLimit(
  name: RateLimitName,
  identifier: string,
): Promise<{ success: boolean; reset?: number }> {
  const ratelimit = getRatelimit(name);
  if (!ratelimit) {
    return { success: true };
  }

  const result = await ratelimit.limit(identifier);
  return { success: result.success, reset: result.reset };
}

export async function checkRequestRateLimit(
  request: NextRequest,
  name: RateLimitName,
): Promise<{ success: boolean; reset?: number; ip: string }> {
  const ip = getClientIp(request);
  const result = await checkRateLimit(name, ip);
  return { ...result, ip };
}
