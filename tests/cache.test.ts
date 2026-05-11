import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const redisStore = new Map<string, unknown>();

vi.mock("@upstash/redis", () => ({
  Redis: class {
    async get<T>(key: string): Promise<T | null> {
      return (redisStore.get(key) as T | undefined) ?? null;
    }

    async set<T>(
      key: string,
      value: T,
      options?: { nx?: boolean },
    ): Promise<"OK" | null> {
      if (options?.nx && redisStore.has(key)) return null;
      redisStore.set(key, value);
      return "OK";
    }

    async del(key: string): Promise<void> {
      redisStore.delete(key);
    }
  },
}));

vi.mock("@/lib/logger", () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("cacheGetOrBuildSnapshot", () => {
  beforeEach(() => {
    redisStore.clear();
    vi.resetModules();
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
  });

  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    vi.restoreAllMocks();
  });

  it("returns fresh cached data without rebuilding", async () => {
    const { cacheGetOrBuildSnapshot, cacheSet } = await import("@/lib/cache");
    const builder = vi.fn().mockResolvedValue("rebuilt");

    await cacheSet("fresh", {
      fetchedAt: new Date().toISOString(),
      data: "cached",
    }, 60);

    const snapshot = await cacheGetOrBuildSnapshot({
      key: "fresh",
      label: "fresh",
      ttlSeconds: 60,
      freshnessSeconds: 60,
      lockTtlSeconds: 10,
      builder,
    });

    expect(snapshot?.data).toBe("cached");
    expect(builder).not.toHaveBeenCalled();
  });

  it("serves stale cached data when rebuild fails", async () => {
    const { cacheGetOrBuildSnapshot, cacheSet } = await import("@/lib/cache");

    await cacheSet("stale", {
      fetchedAt: "2026-01-01T00:00:00.000Z",
      data: "stale-data",
    }, 60);

    const snapshot = await cacheGetOrBuildSnapshot({
      key: "stale",
      label: "stale",
      ttlSeconds: 60,
      freshnessSeconds: 1,
      lockTtlSeconds: 10,
      builder: vi.fn().mockRejectedValue(new Error("upstream failed")),
    });

    expect(snapshot?.data).toBe("stale-data");
  });

  it("does not rebuild a locked cold miss unless a caller provides a fallback", async () => {
    const { cacheGetOrBuildSnapshot, cacheSetIfNotExists } = await import("@/lib/cache");
    const builder = vi.fn().mockResolvedValue("rebuilt");

    await cacheSetIfNotExists("locked:refresh-lock", "1", 10);

    const snapshot = await cacheGetOrBuildSnapshot({
      key: "locked",
      label: "locked",
      ttlSeconds: 60,
      freshnessSeconds: 60,
      lockTtlSeconds: 10,
      builder,
    });

    expect(snapshot).toBeNull();
    expect(builder).not.toHaveBeenCalled();
  });
});
