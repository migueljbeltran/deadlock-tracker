import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_ANALYTICS_TIME_RANGE,
  getMinUnixTimestampForRange,
  parseAnalyticsTimeRange,
} from "@/lib/analyticsTimeRange";

describe("analytics time ranges", () => {
  afterEach(() => vi.useRealTimers());
  it("shares a cache URL within an hour and advances at the next hour", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-13T10:00:01Z"));
    const start = getMinUnixTimestampForRange("day");
    vi.setSystemTime(new Date("2026-10-13T10:59:59Z"));
    expect(getMinUnixTimestampForRange("day")).toBe(start);
    vi.setSystemTime(new Date("2026-10-13T11:00:00Z"));
    expect(getMinUnixTimestampForRange("day")).toBe(start! + 3600);
  });
  it("defaults invalid or missing params to the monthly range", () => {
    expect(parseAnalyticsTimeRange(undefined)).toBe(DEFAULT_ANALYTICS_TIME_RANGE);
    expect(parseAnalyticsTimeRange("invalid")).toBe(DEFAULT_ANALYTICS_TIME_RANGE);
  });

  it("accepts supported time range params", () => {
    expect(parseAnalyticsTimeRange("day")).toBe("day");
    expect(parseAnalyticsTimeRange("week")).toBe("week");
    expect(parseAnalyticsTimeRange("month")).toBe("month");
    expect(parseAnalyticsTimeRange("year")).toBe("year");
    expect(parseAnalyticsTimeRange("all")).toBe("all");
  });

  it("does not apply a minimum timestamp for all-time stats", () => {
    expect(getMinUnixTimestampForRange("all")).toBeNull();
    expect(getMinUnixTimestampForRange("week")).toEqual(expect.any(Number));
  });
});
