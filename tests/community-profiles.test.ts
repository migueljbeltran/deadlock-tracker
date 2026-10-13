import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ unstable_cache: (fn: () => unknown) => fn }));
vi.mock("@/lib/logger", () => ({ default: { error: vi.fn(), warn: vi.fn() } }));
const profile = { account_id: 123, personaname: "Player", profileurl: "https://steamcommunity.com/profiles/76561197960265851",
  avatar: "small.jpg", avatarmedium: "medium.jpg", avatarfull: "full.jpg", friends: [1, 2, 3] };
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("community Steam profiles", () => {
  it("looks up numeric IDs without a Steam key and strips unused arrays", async () => {
    vi.stubEnv("STEAM_API_KEY", "");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [profile] });
    vi.stubGlobal("fetch", fetchMock);
    const { getPlayerSummary } = await import("@/lib/api/steam");
    const result = await getPlayerSummary("76561197960265851");
    expect(result).toMatchObject({ steamid: "76561197960265851", personaname: "Player" });
    expect(result).not.toHaveProperty("friends");
    expect(result).not.toHaveProperty("personastate");
    expect(fetchMock).toHaveBeenCalledWith("https://api.deadlock-api.com/v1/players/steam?account_ids=123", expect.any(Object));
  });
  it("uses a bounded name search covering inactive players too", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [profile] });
    vi.stubGlobal("fetch", fetchMock);
    const { searchCommunityProfiles } = await import("@/lib/api/steam");
    await searchCommunityProfiles("Player");
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.searchParams.get("limit")).toBe("15");
    expect(url.searchParams.get("min_matches_played_last_30d")).toBe("0");
    expect(url.searchParams.get("search_query")).toBe("Player");
  });
});
