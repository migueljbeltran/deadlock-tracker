import type { DeadlockHeroAnalytics } from "@/lib/api/types";

interface AggregatedStats {
  wins: number;
  matches: number;
}

/**
 * Aggregate hero analytics by hero_id, optionally filtering to a minimum rank tier.
 * Returns the per-hero stats map and the grand total of matches across all heroes.
 */
export function aggregateHeroAnalytics(
  analytics: DeadlockHeroAnalytics[],
  minTier: number | null,
): { analyticsMap: Map<number, AggregatedStats>; grandTotalMatches: number } {
  const analyticsMap = new Map<number, AggregatedStats>();

  for (const entry of analytics) {
    if (minTier != null) {
      const entryTier = Math.floor(entry.bucket / 10);
      if (entryTier < minTier) continue;
    }

    const existing = analyticsMap.get(entry.hero_id);
    if (existing) {
      existing.wins += entry.wins;
      existing.matches += entry.matches;
    } else {
      analyticsMap.set(entry.hero_id, { wins: entry.wins, matches: entry.matches });
    }
  }

  let grandTotalMatches = 0;
  for (const { matches } of analyticsMap.values()) {
    grandTotalMatches += matches;
  }

  return { analyticsMap, grandTotalMatches };
}

/**
 * Parse and validate a rank tier from a URL search param.
 * Returns null if the value is missing or invalid (must be integer 0–11).
 */
export function parseRankTier(rankParam: string | undefined): number | null {
  if (rankParam == null) return null;
  const n = Number(rankParam);
  return Number.isInteger(n) && n >= 0 && n <= 11 ? n : null;
}
