import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeadlockLeaderboardEntry } from "@/lib/api/types";

const cacheStore = new Map<string, unknown>();
vi.mock("next/cache", () => ({ unstable_cache: (fn: () => unknown) => fn }));
const getLeaderboard = vi.fn();
const resolveAccountIds = vi.fn();
const getPlayerRanks = vi.fn().mockResolvedValue([]);

vi.mock("@/lib/api/deadlock", () => ({
  getLeaderboard,
  getPlayerRanks,
}));

vi.mock("@/lib/api/resolve", () => ({
  resolveAccountIds,
}));

vi.mock("@/lib/cache", () => ({
  cacheDelete: vi.fn(async (key: string) => {
    cacheStore.delete(key);
  }),
  cacheGet: vi.fn(async <T>(key: string): Promise<T | null> => {
    return (cacheStore.get(key) as T | undefined) ?? null;
  }),
  cacheSet: vi.fn(async <T>(key: string, value: T): Promise<void> => {
    cacheStore.set(key, value);
  }),
  cacheSetIfNotExists: vi.fn(async <T>(key: string, value: T): Promise<boolean> => {
    if (cacheStore.has(key)) return false;
    cacheStore.set(key, value);
    return true;
  }),
  isCacheAvailable: vi.fn(() => true),
}));

vi.mock("@/lib/logger", () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

function createEntry(rank: number, possibleAccountIds: number[]): DeadlockLeaderboardEntry {
  return {
    account_name: `Player ${rank}`,
    possible_account_ids: possibleAccountIds,
    rank,
    top_hero_ids: [1, 2, 3],
    badge_level: 110,
    ranked_rank: 11,
    ranked_subrank: 1,
  };
}

describe("getResolvedLeaderboardSnapshot", () => {
  beforeEach(() => {
    cacheStore.clear();
    getLeaderboard.mockReset();
    resolveAccountIds.mockReset();
    getPlayerRanks.mockReset().mockResolvedValue([]);
    vi.resetModules();
  });

  it("keeps the main leaderboard snapshot fast when profile enrichment is disabled", async () => {
    getLeaderboard.mockResolvedValue([
      createEntry(1, [111, 222]),
    ]);

    const { getResolvedLeaderboardSnapshot } = await import("@/lib/leaderboardSnapshot");
    const snapshot = await getResolvedLeaderboardSnapshot("NAmerica");

    expect(snapshot.entries[0].profileAccountId).toBeNull();
    expect(snapshot.entries[0].profileLinkStatus).toBe("ambiguous");
    expect(resolveAccountIds).not.toHaveBeenCalled();
  });

  it("batches only confirmed visible accounts and keeps placement separate from badges", async () => {
    getLeaderboard.mockResolvedValue(Array.from({ length: 60 }, (_, index) => createEntry(index + 1, [1000 + index])));
    getPlayerRanks.mockResolvedValue([
      { account_id: 1000, badge: 113, rank: 11, subrank: 3, last_match: null },
      { account_id: 1001, badge: 0, rank: 0, subrank: 0, last_match: null },
    ]);
    const { getResolvedLeaderboardSnapshot } = await import("@/lib/leaderboardSnapshot");
    const snapshot = await getResolvedLeaderboardSnapshot("Asia", { page: 1 });
    expect(getPlayerRanks).toHaveBeenCalledOnce();
    expect(getPlayerRanks.mock.calls[0][0]).toHaveLength(50);
    expect(getPlayerRanks.mock.calls[0][0]).not.toContain(1050);
    expect(snapshot.entries[0]).toMatchObject({ rank: 1, badge_level: 113, ranked_rank: 11, ranked_subrank: 3 });
    expect(snapshot.entries[1]).toMatchObject({ rank: 2, ranked_rank: 0 });
    expect(snapshot.entries[2].ranked_rank).toBeNull(); // Omitted/protected accounts must not retain legacy badges.
  });

  it("enriches only visible page entries with confident profile links", async () => {
    getLeaderboard.mockResolvedValue([
      createEntry(1, [111, 222]),
      ...Array.from({ length: 49 }, (_, index) => createEntry(index + 2, [index + 300, index + 400])),
      createEntry(51, [777, 888]),
    ]);
    resolveAccountIds.mockResolvedValue(new Map([
      [0, { accountId: 111, confident: true }],
    ]));

    const { getResolvedLeaderboardSnapshot } = await import("@/lib/leaderboardSnapshot");
    const snapshot = await getResolvedLeaderboardSnapshot("NAmerica", {
      page: 1,
      enrichProfileLinks: true,
    });

    expect(snapshot.entries[0].profileAccountId).toBe(111);
    expect(snapshot.entries[0].profileLinkStatus).toBe("available");
    expect(snapshot.entries[50].profileAccountId).toBeNull();
    expect(snapshot.entries[50].profileLinkStatus).toBe("ambiguous");
  });

  it("does not reuse profile links when the visible page identity changes", async () => {
    getLeaderboard
      .mockResolvedValueOnce([
        createEntry(1, [111, 222]),
      ])
      .mockResolvedValueOnce([
        createEntry(1, [333, 444]),
      ]);
    resolveAccountIds
      .mockResolvedValueOnce(new Map([
        [0, { accountId: 111, confident: true }],
      ]))
      .mockResolvedValueOnce(new Map([
        [0, { accountId: 333, confident: true }],
      ]));

    const { getResolvedLeaderboardSnapshot } = await import("@/lib/leaderboardSnapshot");
    const firstSnapshot = await getResolvedLeaderboardSnapshot("NAmerica", {
      page: 1,
      enrichProfileLinks: true,
    });

    cacheStore.delete("leaderboard-snapshot:NAmerica:v2");

    const secondSnapshot = await getResolvedLeaderboardSnapshot("NAmerica", {
      page: 1,
      enrichProfileLinks: true,
    });

    expect(firstSnapshot.entries[0].profileAccountId).toBe(111);
    expect(secondSnapshot.entries[0].profileAccountId).toBe(333);
    expect(resolveAccountIds).toHaveBeenCalledTimes(2);
  });
});
