// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useLeaderboardSnapshot, type LeaderboardSnapshot } from "@/lib/hooks/useLeaderboardSnapshot";
import { usePlayerSnapshot } from "@/lib/hooks/usePlayerSnapshot";
import type { DeadlockRegion, PlayerSnapshotResponse } from "@/lib/api";

function jsonResponse<T>(body: T): Response {
  return {
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

function createPlayerResponse(): PlayerSnapshotResponse {
  return {
    success: true,
    snapshot: {
      player: {
        steamid: "76561197960265728",
        personaname: "Tester",
        profileurl: "https://steamcommunity.com/id/tester",
        avatar: "",
        avatarmedium: "",
        avatarfull: "",
        personastate: 0,
        communityvisibilitystate: 3,
      },
      heroStats: [],
      matches: [],
      metrics: null,
      rankEstimate: null,
      status: "complete",
      fetchedAt: "2026-05-03T00:00:00.000Z",
    },
    benchmark: null,
    isStale: false,
    shouldRefresh: false,
  };
}

function createLeaderboardSnapshot(): LeaderboardSnapshot {
  return {
    fetchedAt: "2026-05-03T00:00:00.000Z",
    entries: [
      {
        account_name: "Tester",
        possible_account_ids: [123],
        rank: 1,
        top_hero_ids: [1],
        badge_level: 110,
        ranked_rank: 11,
        ranked_subrank: 1,
        resolvedAccountId: 123,
        confident: true,
      },
    ],
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("usePlayerSnapshot", () => {
  it("uses initialData without an initial fetch", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const initialData = createPlayerResponse();

    const { result } = renderHook(() => usePlayerSnapshot({
      accountId: 123,
      initialData,
    }));

    expect(result.current.data).toBe(initialData);
    expect(result.current.isLoading).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refetch triggers the player API with a cache-busting token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(createPlayerResponse()));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => usePlayerSnapshot({
      accountId: 123,
      initialData: createPlayerResponse(),
    }));

    act(() => result.current.refetch());

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/player/123?v=1",
        expect.objectContaining({ cache: "no-store" }),
      );
    });
  });

  it("exposes failed player fetch copy", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network failed"));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => usePlayerSnapshot({ accountId: 123 }));

    await waitFor(() => {
      expect(result.current.fetchError).toBe("Failed to load player data.");
      expect(result.current.isLoading).toBe(false);
    });
  });
});

describe("useLeaderboardSnapshot", () => {
  it("fetches the selected region and clears loading on success", async () => {
    const snapshot = createLeaderboardSnapshot();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(snapshot));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useLeaderboardSnapshot("Asia"));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/leaderboard?region=Asia",
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
      expect(result.current.snapshot).toBe(snapshot);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.hasError).toBe(false);
    });
  });

  it("reports error state after a failed leaderboard fetch", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network failed"));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useLeaderboardSnapshot("Europe"));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.hasError).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("returns to loading when the requested region differs from the loaded region", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(createLeaderboardSnapshot()))
      .mockImplementationOnce(() => new Promise(() => undefined));
    vi.stubGlobal("fetch", fetchMock);

    const { result, rerender } = renderHook(
      ({ region }) => useLeaderboardSnapshot(region),
      { initialProps: { region: "Asia" as DeadlockRegion } },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    rerender({ region: "Europe" });

    expect(result.current.isLoading).toBe(true);
  });
});
