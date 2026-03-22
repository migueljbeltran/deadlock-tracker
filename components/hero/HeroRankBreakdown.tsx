import Image from "next/image";
import type { DeadlockHeroAnalytics, DeadlockRank } from "@/lib/api";
import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/format";

interface HeroRankBreakdownProps {
  analytics: DeadlockHeroAnalytics[];
  ranks: DeadlockRank[];
}

export function HeroRankBreakdown({ analytics, ranks }: HeroRankBreakdownProps) {
  if (analytics.length === 0) return null;

  // Sort by bucket (rank tier)
  const sorted = [...analytics].sort((a, b) => a.bucket - b.bucket);

  // Build rank lookup
  const rankMap = new Map(ranks.map((r) => [r.tier, r]));

  return (
    <div className="overflow-x-auto glass-panel rounded-lg">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-amber bg-gradient-to-r from-amber/15 via-amber/5 to-transparent text-left uppercase tracking-[0.05em] text-xs text-amber">
            <th className="px-3 py-2 sm:px-4">Rank</th>
            <th className="px-2 py-2 text-center">Win Rate</th>
            <th className="px-2 py-2 text-center">Matches</th>
            <th className="hidden px-2 py-2 text-center sm:table-cell">Avg K/D/A</th>
            <th className="hidden px-2 py-2 text-right sm:table-cell">Avg Damage</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry, idx) => {
            const rank = rankMap.get(entry.bucket);
            const winRate = entry.matches > 0
              ? (entry.wins / entry.matches) * 100
              : 0;
            const avgK = entry.matches > 0 ? (entry.total_kills / entry.matches).toFixed(1) : "0";
            const avgD = entry.matches > 0 ? (entry.total_deaths / entry.matches).toFixed(1) : "0";
            const avgA = entry.matches > 0 ? (entry.total_assists / entry.matches).toFixed(1) : "0";
            const avgDmg = entry.matches > 0 ? Math.round(entry.total_player_damage / entry.matches) : 0;

            return (
              <tr
                key={entry.bucket}
                className={cn(
                  "border-b border-border-subtle transition-colors hover:bg-[rgba(31,41,55,0.5)]",
                  idx % 2 === 1 && "bg-[rgba(31,41,55,0.3)]",
                )}
              >
                <td className="px-3 py-2 sm:px-4">
                  <div className="flex items-center gap-2">
                    {rank && (rank.images.large_webp || rank.images.large) && (
                      <Image
                        src={(rank.images.large_webp || rank.images.large)!}
                        alt={rank?.name ?? `Tier ${entry.bucket}`}
                        width={20}
                        height={20}
                      />
                    )}
                    <span
                      className="font-heading text-xs"
                      style={{ color: rank?.color }}
                    >
                      {rank?.name ?? `Tier ${entry.bucket}`}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-2 text-center">
                  <span className={cn("font-mono text-sm", winRate >= 50 ? "text-soul" : "text-blood")}>
                    {winRate.toFixed(1)}%
                  </span>
                </td>
                <td className="px-2 py-2 text-center font-mono text-xs text-text-secondary">
                  {formatNumber(entry.matches)}
                </td>
                <td className="hidden px-2 py-2 text-center sm:table-cell">
                  <span className="font-mono text-xs">
                    <span className="text-soul">{avgK}</span>
                    <span className="text-text-muted"> / </span>
                    <span className="text-blood">{avgD}</span>
                    <span className="text-text-muted"> / </span>
                    <span className="text-sigil">{avgA}</span>
                  </span>
                </td>
                <td className="hidden px-2 py-2 text-right font-mono text-xs text-amber sm:table-cell">
                  {formatNumber(avgDmg)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
