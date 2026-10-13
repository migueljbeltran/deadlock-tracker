import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/logger", () => ({ default: { error: vi.fn() } }));
import { getRankImage } from "@/lib/utils/ranks";
import { deadlockPlayerRankSchema } from "@/lib/api/guards";

describe("current ranked badges", () => {
  it("accepts reported ranks and explicit absence without treating missing data as zero", () => {
    expect(deadlockPlayerRankSchema.parse({ badge: 113, rank: 11, subrank: 3, last_match: null }).rank).toBe(11);
    expect(deadlockPlayerRankSchema.parse({ badge: 0, rank: 0, subrank: 0, last_match: null }).rank).toBe(0);
    expect(deadlockPlayerRankSchema.safeParse({}).success).toBe(false);
  });
  it("uses current division artwork before deprecated small badges and handles missing artwork", () => {
    const rank = { tier: 11, name: "Eternus", color: "#fff", images: {
      subrank3_webp: "current.webp", small_subrank3_webp: "old.webp", large: "large.png",
    } };
    expect(getRankImage(rank, 3)).toBe("current.webp");
    expect(getRankImage(rank, 2)).toBe("large.png");
    expect(getRankImage({ ...rank, images: {} }, 3)).toBeUndefined();
  });
});
