// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import type { DeadlockHero, DeadlockRank } from "@/lib/api";
import type { ResolvedLeaderboardEntry } from "@/lib/leaderboardSnapshot";

function createEntry(overrides: Partial<ResolvedLeaderboardEntry>): ResolvedLeaderboardEntry {
  return {
    account_name: "Tester",
    possible_account_ids: [123],
    rank: 1,
    top_hero_ids: [1],
    badge_level: 110,
    ranked_rank: 11,
    ranked_subrank: 1,
    profileAccountId: 123,
    profileLinkStatus: "available",
    ...overrides,
  };
}

const rankMap = new Map<number, DeadlockRank>();
const heroMap = new Map<number, DeadlockHero>();

describe("LeaderboardTable", () => {
  it("links rows with an available profile account", () => {
    render(
      <LeaderboardTable
        entries={[createEntry({ account_name: "Linked Player" })]}
        rankMap={rankMap}
        heroMap={heroMap}
      />,
    );

    expect(screen.getByRole("link", { name: "Linked Player" }).getAttribute("href")).toBe("/player/123");
  });

  it("renders ambiguous profile rows as normal readable text without a profile link", () => {
    render(
      <LeaderboardTable
        entries={[
          createEntry({
            account_name: "Ambiguous Player",
            possible_account_ids: [123, 456],
            rank: 4,
            profileAccountId: null,
            profileLinkStatus: "ambiguous",
          }),
        ]}
        rankMap={rankMap}
        heroMap={heroMap}
      />,
    );

    const playerName = screen.getByText("Ambiguous Player");

    expect(playerName.className).toContain("text-text-primary");
    expect(screen.queryByRole("link", { name: "Ambiguous Player" })).toBeNull();
  });
});
