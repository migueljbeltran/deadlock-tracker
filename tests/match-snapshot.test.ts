import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeadlockMatchMetadata } from "@/lib/api/types";

const cacheStore = new Map<string, unknown>();
const getMatchDetail = vi.fn();
const getMatchPlayerItems = vi.fn();

vi.mock("@/lib/api/deadlock", () => ({
  getMatchDetail,
  getMatchPlayerItems,
}));

vi.mock("@/lib/cache", () => ({
  cacheGetOrBuildSnapshot: vi.fn(async ({
    key,
    builder,
    onLockedMiss,
  }: {
    key: string;
    builder: () => Promise<unknown>;
    onLockedMiss?: () => Promise<unknown> | unknown;
  }) => {
    if (cacheStore.has(`${key}:refresh-lock`)) {
      const fallback = onLockedMiss ? await onLockedMiss() : null;
      return fallback == null
        ? null
        : { fetchedAt: "2026-05-10T00:00:00.000Z", data: fallback };
    }

    return {
      fetchedAt: "2026-05-10T00:00:00.000Z",
      data: await builder(),
    };
  }),
}));

vi.mock("@/lib/logger", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("getMatchSnapshot", () => {
  beforeEach(() => {
    cacheStore.clear();
    getMatchDetail.mockReset();
    getMatchPlayerItems.mockReset();
    vi.resetModules();
  });

  it("fetches a live snapshot instead of returning null on a locked cold miss", async () => {
    const match = {
      match_id: 123,
      start_time: 1_700_000_000,
      duration_s: 1800,
      players: [],
    } as unknown as DeadlockMatchMetadata;

    cacheStore.set("match-snapshot:123:v2:refresh-lock", "1");
    getMatchDetail.mockResolvedValue(match);
    getMatchPlayerItems.mockResolvedValue(new Map([[42, [1, 2, 3]]]));

    const { getMatchSnapshot } = await import("@/lib/matchSnapshot");

    await expect(getMatchSnapshot(123)).resolves.toEqual({
      fetchedAt: "2026-05-10T00:00:00.000Z",
      match,
      playerItems: [[42, [1, 2, 3]]],
    });
  });
});
