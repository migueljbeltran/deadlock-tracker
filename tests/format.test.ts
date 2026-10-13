import { afterEach, describe, expect, it, vi } from "vitest";
import { formatTimeAgo } from "@/lib/utils/format";
afterEach(() => vi.useRealTimers());
describe("API match timestamps", () => {
  it("interprets API datetime strings and Unix strings in UTC", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-13T11:00:00Z"));
    expect(formatTimeAgo("2026-10-13 10:00:00")).toBe("1h ago");
    expect(formatTimeAgo(String(Date.parse("2026-10-13T10:00:00Z") / 1000))).toBe("1h ago");
  });
});
