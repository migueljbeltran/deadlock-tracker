import { describe, expect, it } from "vitest";
import { searchQuerySchema, accountIdSchema, regionSchema } from "@/lib/validations";

describe("request validation", () => {
  it("accepts common player search inputs", () => {
    expect(searchQuerySchema.safeParse({ q: "76561198000000000" }).success).toBe(true);
    expect(searchQuerySchema.safeParse({ q: "steamcommunity.com/id/example" }).success).toBe(true);
    expect(searchQuerySchema.safeParse({ q: "player name" }).success).toBe(true);
  });

  it("rejects malformed or oversized search inputs", () => {
    expect(searchQuerySchema.safeParse({ q: "" }).success).toBe(false);
    expect(searchQuerySchema.safeParse({ q: "x".repeat(201) }).success).toBe(false);
    expect(searchQuerySchema.safeParse({ q: "bad\u0000input" }).success).toBe(false);
    expect(searchQuerySchema.safeParse({ q: "https://example.com/not-steam" }).success).toBe(false);
  });

  it("rejects invalid route params", () => {
    expect(accountIdSchema.safeParse("123").success).toBe(true);
    expect(accountIdSchema.safeParse("-1").success).toBe(false);
    expect(accountIdSchema.safeParse("abc").success).toBe(false);
    expect(regionSchema.safeParse("Europe").success).toBe(true);
    expect(regionSchema.safeParse("Mars").success).toBe(false);
  });
});
