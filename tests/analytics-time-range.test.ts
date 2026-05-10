import { describe, expect, it } from "vitest";
import {
  DEFAULT_ANALYTICS_TIME_RANGE,
  getMinUnixTimestampForRange,
  parseAnalyticsTimeRange,
} from "@/lib/analyticsTimeRange";

describe("analytics time ranges", () => {
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
