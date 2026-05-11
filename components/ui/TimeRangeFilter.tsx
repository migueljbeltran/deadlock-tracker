"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Clock } from "lucide-react";
import {
  ANALYTICS_TIME_RANGES,
  DEFAULT_ANALYTICS_TIME_RANGE,
  type AnalyticsTimeRange,
} from "@/lib/analyticsTimeRange";
import { cn } from "@/lib/utils/cn";

interface TimeRangeFilterProps {
  currentRange: AnalyticsTimeRange;
  baseUrl: string;
}

export function TimeRangeFilter({ currentRange, baseUrl }: TimeRangeFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function selectRange(range: AnalyticsTimeRange) {
    const params = new URLSearchParams(searchParams.toString());
    if (range === DEFAULT_ANALYTICS_TIME_RANGE) {
      params.delete("time");
    } else {
      params.set("time", range);
    }
    const qs = params.toString();
    router.push(`${baseUrl}${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="flex items-center gap-2">
      <Clock className="h-3.5 w-3.5 text-text-muted" />
      <div className="flex flex-wrap gap-1 glass-panel rounded-lg p-1">
        {ANALYTICS_TIME_RANGES.map((range) => (
          <button
            key={range.value}
            type="button"
            onClick={() => selectRange(range.value)}
            className={cn(
              "rounded px-2.5 py-1.5 text-xs font-medium transition-colors",
              currentRange === range.value
                ? "bg-text-primary text-deep"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            {range.label}
          </button>
        ))}
      </div>
    </div>
  );
}
