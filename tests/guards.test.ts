import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/logger", () => ({
  default: {
    error: vi.fn(),
  },
}));

import {
  deadlockHeroSchema,
  deadlockLeaderboardResponseSchema,
  parseExternalData,
  steamPlayerSummariesResponseSchema,
} from "@/lib/api/guards";
import { ApiError } from "@/lib/api/types";

describe("external API guards", () => {
  it("accepts valid Steam player summaries", () => {
    const parsed = parseExternalData(steamPlayerSummariesResponseSchema, {
      response: {
        players: [{
          steamid: "76561198000000000",
          personaname: "Player",
          profileurl: "https://steamcommunity.com/profiles/76561198000000000",
          avatar: "small.jpg",
          avatarmedium: "medium.jpg",
          avatarfull: "full.jpg",
          personastate: 0,
          communityvisibilitystate: 3,
        }],
      },
    }, "Steam test");

    expect(parsed.response.players[0].personaname).toBe("Player");
  });

  it("rejects malformed hero payloads", () => {
    expect(() => parseExternalData(deadlockHeroSchema, {
      id: "not-a-number",
      class_name: "hero",
      name: "Hero",
      description: {},
    }, "Hero test")).toThrow(ApiError);
  });

  it("accepts leaderboard response payloads", () => {
    const parsed = parseExternalData(deadlockLeaderboardResponseSchema, {
      entries: [{
        account_name: "Player",
        possible_account_ids: [123],
        rank: 1,
        top_hero_ids: [1, 2],
        badge_level: 5,
        ranked_rank: 6,
        ranked_subrank: 2,
      }],
    }, "Leaderboard test");

    expect(parsed.entries[0].possible_account_ids).toEqual([123]);
  });
});
