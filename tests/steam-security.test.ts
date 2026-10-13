import { afterEach, describe, expect, it, vi } from "vitest";

const { warn, error } = vi.hoisted(() => ({ warn: vi.fn(), error: vi.fn() }));
vi.mock("next/cache", () => ({ unstable_cache: (fn: () => unknown) => fn }));
vi.mock("@/lib/logger", () => ({ default: { warn, error } }));

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("Steam credential safety", () => {
  it("keeps API keys out of timeout errors and every retry log", async () => {
    vi.useFakeTimers();
    vi.stubEnv("STEAM_API_KEY", "test-secret-steam-key");
    const fetchMock = vi.fn().mockRejectedValue(new DOMException("Timed out", "TimeoutError"));
    vi.stubGlobal("fetch", fetchMock);
    const { getPlayerSummary } = await import("@/lib/api/steam");
    const resultPromise = getPlayerSummary("76561197960265851").catch((err) => err);
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0][0]).toContain("key=test-secret-steam-key");
    expect(result).toMatchObject({ status: 408, endpoint: "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/" });
    expect(JSON.stringify({ result, warnings: warn.mock.calls, errors: error.mock.calls })).not.toContain("test-secret-steam-key");
  });

  it("discards credential-bearing native fetch messages and causes", async () => {
    vi.stubEnv("STEAM_API_KEY", "test-secret-steam-key");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Failed key=test-secret-steam-key", {
      cause: { url: "https://api.steampowered.com/?key=test-secret-steam-key" },
    })));
    const { getPlayerSummary } = await import("@/lib/api/steam");
    const result = await getPlayerSummary("76561197960265851").catch((err) => err);
    expect(result).toMatchObject({ status: 502, message: "Steam API request failed" });
    expect(result.cause).toBeUndefined();
    expect(result.stack).not.toContain("test-secret-steam-key");
    expect(JSON.stringify(result)).not.toContain("test-secret-steam-key");
  });
});
