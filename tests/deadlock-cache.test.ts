import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DeadlockMatchMetadata } from "@/lib/api/types";

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
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("Deadlock cached API paths", () => {
  beforeEach(() => {
    redisStore.clear();
    vi.resetModules();
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
  });

  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("serves stale match history when the upstream rebuild fails", async () => {
    const { cacheSet } = await import("@/lib/cache");
    const { getMatchHistory } = await import("@/lib/api/deadlock");
    const cachedMatches = [{
      match_id: 123,
      start_time: 1_700_000_000,
      duration_s: 1800,
      players: [],
    }] as unknown as DeadlockMatchMetadata[];

    await cacheSet("deadlock:match-history:42:20:v1", {
      fetchedAt: "2026-01-01T00:00:00.000Z",
      data: cachedMatches,
    }, 604800);

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("upstream failed")));

    await expect(getMatchHistory(42, 20)).resolves.toEqual(cachedMatches);
  });

  it("adds time-window params to hero analytics requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([{
        hero_id: 1,
        bucket: 110,
        wins: 10,
        losses: 5,
        matches: 15,
        players: 12,
        total_kills: 100,
        total_deaths: 50,
        total_assists: 80,
        total_net_worth: 100000,
        total_last_hits: 1200,
        total_denies: 40,
        total_player_damage: 200000,
        total_player_damage_taken: 150000,
        total_boss_damage: 5000,
        total_creep_damage: 30000,
        total_neutral_damage: 10000,
        total_shots_hit: 500,
        total_shots_missed: 300,
        total_max_health: 10000,
      }]),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { getHeroAnalytics } = await import("@/lib/api/deadlock");
    await getHeroAnalytics("week");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/v1\/analytics\/hero-stats\?bucket=avg_badge&min_unix_timestamp=\d+/),
      expect.any(Object),
    );
  });

  it("omits time-window params for all-time item stats", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([{
        item_id: 1,
        bucket: 110,
        wins: 10,
        losses: 5,
        matches: 15,
        players: 12,
        avg_buy_time_s: 300,
        avg_sell_time_s: 0,
        avg_buy_time_relative: 0.25,
        avg_sell_time_relative: 0,
      }]),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { getItemStats } = await import("@/lib/api/deadlock");
    await getItemStats(undefined, "all");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.deadlock-api.com/v1/analytics/item-stats",
      expect.any(Object),
    );
  });
});
