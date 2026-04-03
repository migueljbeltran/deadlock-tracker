"use client";

import Link from "next/link";
import Image from "next/image";
import { Medal } from "lucide-react";
import { motion } from "framer-motion";
import type { DeadlockRank, DeadlockHero } from "@/lib/api";
import { cn } from "@/lib/utils/cn";
import type { ResolvedLeaderboardEntry } from "@/lib/leaderboardSnapshot";

interface LeaderboardTableProps {
  entries: ResolvedLeaderboardEntry[];
  rankMap: Map<number, DeadlockRank>;
  heroMap: Map<number, DeadlockHero>;
}

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export function LeaderboardTable({
  entries,
  rankMap,
  heroMap,
}: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        No leaderboard data available for this region.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg glass-panel">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-amber bg-gradient-to-r from-amber/15 via-amber/5 to-transparent text-left uppercase tracking-[0.05em] text-xs text-amber">
            <th className="px-3 py-2 w-16 text-center">#</th>
            <th className="px-3 py-2">Player</th>
            <th className="px-3 py-2 text-center">Rank</th>
            <th className="hidden px-3 py-2 sm:table-cell">Top Heroes</th>
          </tr>
        </thead>
        <motion.tbody
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.03 }}
        >
          {entries.map((entry, idx) => {
            const rank = rankMap.get(entry.ranked_rank);
            const playerAccountId = entry.resolvedAccountId;
            const isConfident = entry.confident;

            const isTop1 = entry.rank === 1;
            const isTop2 = entry.rank === 2;
            const isTop3 = entry.rank === 3;

            return (
              <motion.tr
                key={`${entry.rank}-${entry.account_name}-${idx}`}
                variants={rowVariants}
                className={cn(
                  "border-b border-border-subtle hover:bg-[rgba(31,41,55,0.4)] hover:translate-x-0.5 transition-all",
                  isTop1 && "border-l-2 border-l-amber bg-gradient-to-r from-amber/10 to-transparent",
                  isTop2 && "border-l-2 border-l-silver bg-gradient-to-r from-silver/[0.07] to-transparent",
                  isTop3 && "border-l-2 border-l-bronze bg-gradient-to-r from-bronze/[0.07] to-transparent",
                )}
              >
                <td className={cn(
                  "px-3 py-2 text-center font-mono",
                  isTop1 ? "font-display text-amber text-lg" : "text-amber",
                )}>
                  {isTop1 && <Medal className="inline-block mr-1 h-4 w-4 -translate-y-px text-amber" />}
                  {isTop2 && <Medal className="inline-block mr-1 h-4 w-4 -translate-y-px text-silver" />}
                  {isTop3 && <Medal className="inline-block mr-1 h-4 w-4 -translate-y-px text-bronze" />}
                  {entry.rank}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    {playerAccountId && isConfident ? (
                      <Link
                        href={`/player/${playerAccountId}`}
                        className={cn(
                          "hover:text-soul transition-colors",
                          isTop1
                            ? "bg-clip-text text-transparent bg-gradient-to-b from-amber-light to-amber"
                            : "text-text-primary",
                        )}
                      >
                        {entry.account_name || `Player #${entry.rank}`}
                      </Link>
                    ) : (
                      <span className="text-text-muted">
                        {entry.account_name || `Player #${entry.rank}`}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 text-center">
                  {rank?.images ? (
                    <div className="relative mx-auto h-7 w-7">
                      <Image
                        src={rank.images[`small_subrank${entry.ranked_subrank}_webp`] ?? rank.images.large_webp ?? rank.images.large ?? ""}
                        alt={rank.name}
                        fill
                        sizes="28px"
                        className="object-contain"
                        title={`${rank.name} ${entry.ranked_subrank}`}
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-text-muted">{rank?.name ?? "—"}</span>
                  )}
                </td>
                <td className="hidden px-3 py-2 sm:table-cell">
                  <div className="flex gap-1">
                    {entry.top_hero_ids.slice(0, 3).map((heroId) => {
                      const hero = heroMap.get(heroId);
                      return hero?.images?.icon_image_small_webp ? (
                        <Link key={heroId} href={`/heroes/${heroId}`}>
                          <Image
                            src={hero.images.icon_image_small_webp}
                            alt={hero.name}
                            width={28}
                            height={28}
                            className="rounded"
                            title={hero.name}
                          />
                        </Link>
                      ) : (
                        <div
                          key={heroId}
                          className="flex h-7 w-7 items-center justify-center rounded bg-surface-elevated text-[10px] text-text-muted"
                        >
                          ?
                        </div>
                      );
                    })}
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </motion.tbody>
      </table>
    </div>
  );
}
