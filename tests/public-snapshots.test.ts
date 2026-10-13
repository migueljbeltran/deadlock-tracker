import { beforeEach, describe, expect, it, vi } from "vitest";

const { getHeroAnalytics, cacheAvailable, acquireLock } = vi.hoisted(() => ({
  getHeroAnalytics: vi.fn(),
  cacheAvailable: vi.fn(() => false),
  acquireLock: vi.fn(),
}));
vi.mock("next/cache", () => ({ unstable_cache: (fn: () => unknown) => fn }));
vi.mock("@/lib/api/deadlock", () => ({
  getHeroAnalytics,
  getApiInfo: vi.fn(),
  getItemStats: vi.fn(),
  getItems: vi.fn(),
}));
vi.mock("@/lib/cache", () => ({
  isCacheAvailable: cacheAvailable,
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn(),
  cacheDelete: vi.fn(),
  cacheSetIfNotExists: acquireLock,
}));
vi.mock("@/lib/logger", () => ({ default: { info: vi.fn(), warn: vi.fn() } }));

describe("public snapshot rebuilds", () => {
  beforeEach(() => {
    vi.resetModules();
    getHeroAnalytics.mockReset();
    cacheAvailable.mockReturnValue(false);
    acquireLock.mockReset();
  });
  it("coalesces concurrent requests when Redis is not configured", async () => {
    let finish!: (value: []) => void;
    getHeroAnalytics.mockImplementation(() => new Promise<[]>((resolve) => { finish = resolve; }));
    const { getHeroAnalyticsSnapshot } = await import("@/lib/publicSnapshots");
    const first = getHeroAnalyticsSnapshot("month");
    const second = getHeroAnalyticsSnapshot("month");
    finish([]);
    const [a, b] = await Promise.all([first, second]);
    expect(a).toEqual(b);
    expect(getHeroAnalytics).toHaveBeenCalledOnce();
  });
  it("allows a failed rebuild to be retried", async () => {
    getHeroAnalytics.mockRejectedValueOnce(new Error("upstream down")).mockResolvedValueOnce([]);
    const { getHeroAnalyticsSnapshot } = await import("@/lib/publicSnapshots");
    await expect(getHeroAnalyticsSnapshot()).rejects.toThrow("upstream down");
    await expect(getHeroAnalyticsSnapshot()).resolves.toMatchObject({ data: [] });
    expect(getHeroAnalytics).toHaveBeenCalledTimes(2);
  });
  it("rolls badge subranks into tiers without changing wins or appearances", async () => {
    const base = { hero_id: 1, wins: 4, losses: 6, matches: 10, total_kills: 20,
      total_deaths: 10, total_assists: 30, total_net_worth: 100, total_last_hits: 10,
      total_denies: 1, total_player_damage: 200, total_player_damage_taken: 100,
      total_boss_damage: 10, total_creep_damage: 10, total_neutral_damage: 10,
      total_shots_hit: 20, total_shots_missed: 10, total_max_health: 100 };
    getHeroAnalytics.mockResolvedValue([{ ...base, bucket: 101 }, { ...base, bucket: 106 }, { ...base, bucket: 111 }]);
    const { getHeroAnalyticsSnapshot } = await import("@/lib/publicSnapshots");
    const { data } = await getHeroAnalyticsSnapshot();
    expect(data).toHaveLength(2);
    expect(data[0]).toMatchObject({ hero_id: 1, bucket: 100, wins: 8, matches: 20, total_kills: 40 });
    expect(data[1]).toMatchObject({ bucket: 110, wins: 4, matches: 10 });
  });
  it("does not rebuild a cold dataset already locked by another instance", async () => {
    cacheAvailable.mockReturnValue(true);
    acquireLock.mockResolvedValue(false);
    const { getHeroAnalyticsSnapshot } = await import("@/lib/publicSnapshots");
    await expect(getHeroAnalyticsSnapshot()).rejects.toThrow("refreshing");
    expect(getHeroAnalytics).not.toHaveBeenCalled();
  });
});
