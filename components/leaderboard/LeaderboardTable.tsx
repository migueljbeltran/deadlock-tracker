import Link from "next/link";
import Image from "next/image";
import type { DeadlockLeaderboardEntry, DeadlockRank, DeadlockHero } from "@/lib/api";

interface LeaderboardTableProps {
  entries: DeadlockLeaderboardEntry[];
  rankMap: Map<number, DeadlockRank>;
  heroMap: Map<number, DeadlockHero>;
}

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
    <div className="overflow-x-auto rounded border border-border-subtle">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-amber bg-surface-elevated text-left uppercase tracking-[0.05em] text-xs text-amber">
            <th className="px-3 py-2 w-16 text-center">#</th>
            <th className="px-3 py-2">Player</th>
            <th className="px-3 py-2 text-center">Rank</th>
            <th className="hidden px-3 py-2 sm:table-cell">Top Heroes</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, idx) => {
            const rank = rankMap.get(entry.ranked_rank);
            const playerAccountId = entry.possible_account_ids.length > 0
              ? entry.possible_account_ids[0]
              : null;

            return (
              <tr
                key={idx}
                className="border-b border-border-subtle transition-colors hover:border-l-2 hover:border-l-soul hover:bg-surface"
              >
                <td className="px-3 py-2 text-center font-mono text-amber">
                  {entry.rank}
                </td>
                <td className="px-3 py-2">
                  {playerAccountId ? (
                    <Link
                      href={`/player/${playerAccountId}`}
                      className="text-text-primary hover:text-soul transition-colors"
                    >
                      {entry.account_name || `Player #${entry.rank}`}
                    </Link>
                  ) : (
                    <span className="text-text-primary">
                      {entry.account_name || `Player #${entry.rank}`}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  {rank?.images ? (
                    <Image
                      src={rank.images[`small_subrank${entry.ranked_subrank}_webp`] ?? rank.images.small_webp}
                      alt={rank.name}
                      width={28}
                      height={28}
                      className="mx-auto"
                      title={`${rank.name} ${entry.ranked_subrank}`}
                    />
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
                            width={24}
                            height={24}
                            className="rounded"
                            title={hero.name}
                          />
                        </Link>
                      ) : (
                        <div
                          key={heroId}
                          className="flex h-6 w-6 items-center justify-center rounded bg-surface-elevated text-[10px] text-text-muted"
                        >
                          ?
                        </div>
                      );
                    })}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
