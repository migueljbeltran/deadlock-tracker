import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function createRatelimit() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    // No-op fallback for local dev without Redis
    return null;
  }

  return new Ratelimit({
    redis: new Redis({ url, token }),
    // 10 requests per 60s per IP — prevents search API abuse while allowing normal usage
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    analytics: true,
    prefix: "dltracker:ratelimit",
  });
}

const ratelimit = createRatelimit();

export async function checkRateLimit(ip: string): Promise<{ success: boolean; reset?: number }> {
  if (!ratelimit) {
    return { success: true };
  }

  const result = await ratelimit.limit(ip);
  return { success: result.success, reset: result.reset };
}
