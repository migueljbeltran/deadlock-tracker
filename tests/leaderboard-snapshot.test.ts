import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeadlockLeaderboardEntry } from "@/lib/api/types";

const cacheStore = new Map<string, unknown>();
const getLeaderboard = vi.fn();
const resolveAccountIds = vi.fn();

vi.mock("@/lib/api/deadlock", () => ({
  getLeaderboard,
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

    cacheStore.delete("leaderboard-snapshot:NAmerica:v1");

    const secondSnapshot = await getResolvedLeaderboardSnapshot("NAmerica", {
      page: 1,
      enrichProfileLinks: true,
    });

    expect(firstSnapshot.entries[0].profileAccountId).toBe(111);
    expect(secondSnapshot.entries[0].profileAccountId).toBe(333);
    expect(resolveAccountIds).toHaveBeenCalledTimes(2);
  });
});
