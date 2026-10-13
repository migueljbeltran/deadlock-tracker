import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/logger", () => ({
  default: {
    error: vi.fn(),
  },
}));

import {
  deadlockHeroSchema,
  deadlockRankSchema,
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

  it("normalizes nullable hero descriptions and image URLs without rejecting the roster", () => {
    const parsed = parseExternalData(deadlockHeroSchema.array(), [{
      id: 1,
      class_name: "hero",
      name: "Hero",
      description: { lore: null, role: null, playstyle: null },
      images: { icon_image_small: null, icon_hero_card: "card.jpg" },
    }, {
      id: 2,
      class_name: "another_hero",
      name: "Another Hero",
      description: { lore: "Hero lore" },
    }], "Hero roster test");

    expect(parsed).toHaveLength(2);
    expect(parsed[0].description).toEqual({ lore: undefined, role: undefined, playstyle: undefined });
    expect(parsed[0].images).toEqual({ icon_image_small: undefined, icon_hero_card: "card.jpg" });
    expect(parsed[1].description.lore).toBe("Hero lore");
    expect(parsed[1].description.role).toBeUndefined();
    expect(parsed[1].images).toBeUndefined();
  });

  it("normalizes nullable rank image URLs without rejecting the rank list", () => {
    const parsed = parseExternalData(deadlockRankSchema.array(), [{
      tier: 0,
      name: "Unranked",
      color: "#ffffff",
      images: { large: null, small_webp: null, subrank1: "rank.jpg" },
    }], "Rank assets test");

    expect(parsed[0].images).toEqual({ large: undefined, small_webp: undefined, subrank1: "rank.jpg" });
  });

  it("still rejects non-string asset descriptions and image URLs", () => {
    expect(deadlockHeroSchema.safeParse({
      id: 1, class_name: "hero", name: "Hero", description: { lore: 123 },
    }).success).toBe(false);
    expect(deadlockRankSchema.safeParse({
      tier: 0, name: "Unranked", color: "#ffffff", images: { large: 123 },
    }).success).toBe(false);
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
  it("accepts current leaderboards without inventing missing rank badges", () => {
    const parsed = parseExternalData(deadlockLeaderboardResponseSchema, {
      entries: [{ account_name: "Player", possible_account_ids: [], rank: 1, top_hero_ids: [] }],
    }, "Current leaderboard");
    expect(parsed.entries[0].ranked_rank).toBeNull();
    expect(parsed.entries[0].ranked_subrank).toBeNull();
  });
});
