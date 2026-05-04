import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/ratelimit", () => ({
  checkRequestRateLimit: vi.fn().mockResolvedValue({ success: true }),
  rateLimitResponse: vi.fn(),
}));

vi.mock("@/lib/leaderboardSnapshot", () => ({
  getResolvedLeaderboardSnapshot: vi.fn().mockResolvedValue({ entries: [], fetchedAt: new Date().toISOString() }),
}));

vi.mock("@/lib/playerSnapshot", () => ({
  getPlayerSnapshotState: vi.fn().mockResolvedValue({ snapshot: null, isStale: false, shouldRefresh: false }),
}));

vi.mock("@/lib/playerBenchmark", () => ({
  getLatestGlobalPlayerMetricsBenchmark: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/cache", () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/leaderboardSearch", () => ({
  searchLeaderboardByNameCached: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/api", () => ({
  isValidSteam64: vi.fn().mockReturnValue(false),
  resolveVanityURL: vi.fn().mockResolvedValue(null),
  getPlayerSummary: vi.fn().mockResolvedValue(null),
  steam64ToAccountId: vi.fn(),
  accountIdToSteam64: vi.fn(),
  resolveAccountIds: vi.fn().mockResolvedValue(new Map()),
}));

describe("API route validation", () => {
  it("returns 400 for malformed search input", async () => {
    const { GET } = await import("@/app/api/search/route");
    const response = await GET(new NextRequest("http://localhost/api/search?q=https://example.com/nope"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe("Only Steam profile URLs are supported");
  });

  it("returns 400 for invalid leaderboard regions", async () => {
    const { GET } = await import("@/app/api/leaderboard/route");
    const response = await GET(new NextRequest("http://localhost/api/leaderboard?region=Mars"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ success: false, error: "Invalid region" });
  });

  it("returns 400 for invalid player account IDs", async () => {
    const { GET } = await import("@/app/api/player/[accountId]/route");
    const response = await GET(
      new NextRequest("http://localhost/api/player/not-a-number"),
      { params: Promise.resolve({ accountId: "not-a-number" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ success: false, error: "Invalid account ID" });
  });
});
