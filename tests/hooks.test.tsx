// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useLeaderboardSnapshot, type LeaderboardSnapshot } from "@/lib/hooks/useLeaderboardSnapshot";
import { usePlayerSnapshot } from "@/lib/hooks/usePlayerSnapshot";
import type { DeadlockRegion, PlayerSnapshotResponse } from "@/lib/api";

function jsonResponse<T>(body: T): Response {
  return {
    ok: true,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

function failedResponse(): Response {
  return {
    ok: false,
    json: vi.fn().mockResolvedValue({ success: false, error: "Unavailable" }),
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

function createPlayerResponseWithMatch(): PlayerSnapshotResponse {
  const response = createPlayerResponse();
  if (!response.success) return response;

  return {
    ...response,
    snapshot: {
      ...response.snapshot,
      matches: [{
        match_id: 456,
        start_time: "1700000000",
        duration_s: 1800,
        winning_team: "Team0",
        match_mode: "Ranked",
        player_team: "Team0",
        hero_id: 1,
        kills: 5,
        deaths: 2,
        assists: 9,
      }],
    },
  };
}

function createPlayerResponseWithFullSnapshot(): PlayerSnapshotResponse {
  const response = createPlayerResponseWithMatch();
  if (!response.success) return response;

  return {
    ...response,
    snapshot: {
      ...response.snapshot,
      heroStats: [{
        account_id: 123,
        hero_id: 1,
        matches_played: 12,
        last_played: 1700000000,
        time_played: 21600,
        wins: 7,
        ending_level: 144,
        kills: 96,
        deaths: 42,
        assists: 128,
        denies_per_match: 3,
        kills_per_min: 0.27,
        deaths_per_min: 0.12,
        assists_per_min: 0.36,
        networth_per_min: 720,
        last_hits_per_min: 4.8,
        damage_per_min: 850,
        accuracy: 0.32,
        matches: [],
      }],
      metrics: {
        kills: {
          avg: 8,
          std: 2,
          percentile1: 1,
          percentile5: 2,
          percentile10: 3,
          percentile25: 5,
          percentile50: 8,
          percentile75: 10,
          percentile90: 12,
          percentile95: 14,
          percentile99: 18,
        },
      },
      status: "complete",
    },
    shouldRefresh: false,
  };
}

function createPartialPlayerResponse(): PlayerSnapshotResponse {
  const response = createPlayerResponse();
  if (!response.success) return response;

  return {
    ...response,
    snapshot: {
      ...response.snapshot,
      matches: [],
      matchDataIncomplete: true,
      status: "partial",
    },
    shouldRefresh: true,
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
        profileAccountId: 123,
        profileLinkStatus: "available",
      },
    ],
  };
}

afterEach(() => {
  vi.useRealTimers();
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
        "/api/player/123?v=1&attempt=0",
        expect.objectContaining({ cache: "no-store" }),
      );
    });
  });

  it("keeps existing match history when a refetch returns degraded match data", async () => {
    const initialData = createPlayerResponseWithMatch();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(createPartialPlayerResponse()));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => usePlayerSnapshot({
      accountId: 123,
      initialData,
    }));

    act(() => result.current.refetch());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data?.success).toBe(true);
      if (result.current.data?.success) {
        expect(result.current.data.snapshot.matches).toHaveLength(1);
        expect(result.current.data.snapshot.matchDataIncomplete).toBe(false);
      }
    });
  });

  it("keeps existing hero stats and metrics when a refetch returns partial player data", async () => {
    const initialData = createPlayerResponseWithFullSnapshot();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(createPartialPlayerResponse()));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => usePlayerSnapshot({
      accountId: 123,
      initialData,
    }));

    act(() => result.current.refetch());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data?.success).toBe(true);
      if (result.current.data?.success) {
        expect(result.current.data.snapshot.matches).toHaveLength(1);
        expect(result.current.data.snapshot.heroStats).toHaveLength(1);
        expect(result.current.data.snapshot.metrics).toEqual(initialData.success ? initialData.snapshot.metrics : null);
        expect(result.current.data.snapshot.status).toBe("complete");
        expect(result.current.data.shouldRefresh).toBe(false);
      }
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
  it("uses initial snapshot without an initial fetch", () => {
    const snapshot = createLeaderboardSnapshot();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useLeaderboardSnapshot("NAmerica", 1, {
      initialRegion: "NAmerica",
      initialSnapshot: snapshot,
    }));

    expect(result.current.snapshot).toBe(snapshot);
    expect(result.current.isLoading).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches the selected region and clears loading on success", async () => {
    const snapshot = createLeaderboardSnapshot();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(snapshot));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useLeaderboardSnapshot("Asia"));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/leaderboard?region=Asia&page=1",
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
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(result.current.hasError).toBe(true);
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 3000 });
  });

  it("retries transient leaderboard failures before showing data", async () => {
    const snapshot = createLeaderboardSnapshot();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(failedResponse())
      .mockResolvedValueOnce(jsonResponse(snapshot));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useLeaderboardSnapshot("Europe"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(result.current.snapshot).toBe(snapshot);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.hasError).toBe(false);
    }, { timeout: 3000 });
  });

  it("returns to loading when the requested region differs from the loaded region", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(createLeaderboardSnapshot()))
      .mockReturnValue(new Promise(() => undefined));
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

  it("returns to loading when the requested leaderboard page differs from the loaded page", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(createLeaderboardSnapshot()))
      .mockReturnValue(new Promise(() => undefined));
    vi.stubGlobal("fetch", fetchMock);

    const { result, rerender } = renderHook(
      ({ page }) => useLeaderboardSnapshot("Asia", page),
      { initialProps: { page: 1 } },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    rerender({ page: 2 });

    expect(result.current.isLoading).toBe(true);
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/leaderboard?region=Asia&page=2",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });
});
