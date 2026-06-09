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
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("Deadlock API paths", () => {
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

  it("fetches match history without writing the full response to Redis", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([]),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { getMatchHistory } = await import("@/lib/api/deadlock");
    await expect(getMatchHistory(42, 20)).resolves.toEqual([]);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("account_ids=42"),
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(redisStore.size).toBe(0);
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
