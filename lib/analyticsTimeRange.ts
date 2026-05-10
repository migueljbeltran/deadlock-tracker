export type AnalyticsTimeRange = "day" | "week" | "month" | "year" | "all";

export const ANALYTICS_TIME_RANGES: {
  value: AnalyticsTimeRange;
  label: string;
  seconds: number | null;
}[] = [
  { value: "day", label: "Past Day", seconds: 86400 },
  { value: "week", label: "Past Week", seconds: 604800 },
  { value: "month", label: "Past Month", seconds: 2592000 },
  { value: "year", label: "Past Year", seconds: 31536000 },
  { value: "all", label: "All Time", seconds: null },
];

export const DEFAULT_ANALYTICS_TIME_RANGE: AnalyticsTimeRange = "month";

export function parseAnalyticsTimeRange(value: string | undefined | null): AnalyticsTimeRange {
  return ANALYTICS_TIME_RANGES.some((range) => range.value === value)
    ? (value as AnalyticsTimeRange)
    : DEFAULT_ANALYTICS_TIME_RANGE;
}

export function getAnalyticsTimeRangeLabel(value: AnalyticsTimeRange): string {
  return ANALYTICS_TIME_RANGES.find((range) => range.value === value)?.label ?? "Past Month";
}

export function getMinUnixTimestampForRange(value: AnalyticsTimeRange): number | null {
  const range = ANALYTICS_TIME_RANGES.find((item) => item.value === value);
  if (!range || range.seconds == null) return null;
  return Math.floor(Date.now() / 1000) - range.seconds;
}
