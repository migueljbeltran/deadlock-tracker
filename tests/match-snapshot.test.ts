import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeadlockMatchMetadata } from "@/lib/api/types";

const getMatchDetail = vi.fn();
const getMatchPlayerItems = vi.fn();

vi.mock("@/lib/api/deadlock", () => ({
  getMatchDetail,
  getMatchPlayerItems,
}));

vi.mock("@/lib/logger", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("getMatchSnapshot", () => {
  beforeEach(() => {
    getMatchDetail.mockReset();
    getMatchPlayerItems.mockReset();
    vi.resetModules();
  });

  it("fetches a live snapshot without writing it to Redis", async () => {
    const match = {
      match_id: 123,
      start_time: 1_700_000_000,
      duration_s: 1800,
      players: [],
    } as unknown as DeadlockMatchMetadata;

    getMatchDetail.mockResolvedValue(match);
    getMatchPlayerItems.mockResolvedValue(new Map([[42, [1, 2, 3]]]));

    const { getMatchSnapshot } = await import("@/lib/matchSnapshot");

    await expect(getMatchSnapshot(123)).resolves.toEqual({
      fetchedAt: expect.any(String),
      match,
      playerItems: [[42, [1, 2, 3]]],
    });

    expect(getMatchDetail).toHaveBeenCalledOnce();
    expect(getMatchPlayerItems).toHaveBeenCalledOnce();
  });
});
