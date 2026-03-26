import Image from "next/image";
import { formatDuration, formatTimeAgo } from "@/lib/utils/format";
import type { DeadlockMatchMetadata, DeadlockRank } from "@/lib/api";

interface MatchHeaderProps {
  match: DeadlockMatchMetadata;
  ranks?: DeadlockRank[];
}

function getRankForBadge(badgeValue: number | null | undefined, ranks: DeadlockRank[]): { rank: DeadlockRank; subrank: number } | null {
  if (badgeValue == null) return null;
  const tier = Math.floor(badgeValue / 10);
  const subrank = Math.round(badgeValue % 10);
  const rank = ranks.find((r) => r.tier === tier) ?? null;
  if (!rank) return null;
  return { rank, subrank };
}

/** Faction colors from official Deadlock art */
const ARCHMOTHER_COLOR = "#5EBBF0"; // ice-blue
const HIDDEN_KING_COLOR = "#D4A853"; // amber/fire

export function MatchHeader({ match, ranks }: MatchHeaderProps) {
  const winnerColor = match.winning_team === "Team0" ? ARCHMOTHER_COLOR : HIDDEN_KING_COLOR;
  const team0Rank = ranks ? getRankForBadge(match.average_badge_team0, ranks) : null;
  const team1Rank = ranks ? getRankForBadge(match.average_badge_team1, ranks) : null;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
      <div className="text-center sm:text-left">
        <h1 className="font-display text-4xl tracking-wide sm:text-5xl bg-clip-text text-transparent bg-gradient-to-b from-amber-light via-amber to-amber/70">
          Match #{match.match_id}
        </h1>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-sm text-text-secondary sm:justify-start">
          <span className="inline-flex items-center rounded-full bg-[rgba(22,27,34,0.92)] border border-border-subtle px-3 py-1 text-xs font-mono text-text-secondary">
            {match.game_mode}
          </span>
          <span className="inline-flex items-center rounded-full bg-[rgba(22,27,34,0.92)] border border-border-subtle px-3 py-1 text-xs font-mono text-text-secondary">
            {formatDuration(match.duration_s)}
          </span>
          <span className="inline-flex items-center rounded-full bg-[rgba(22,27,34,0.92)] border border-border-subtle px-3 py-1 text-xs font-mono text-text-secondary">
            {formatTimeAgo(match.start_time)}
          </span>
        </div>

        {/* Team Average Ranks */}
        {(team0Rank || team1Rank) && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {team0Rank && (
              <div className="flex items-center gap-1.5 glass-panel rounded-full px-3 py-1">
                {(team0Rank.rank.images.large_webp || team0Rank.rank.images.large) && (
                  <div className="relative h-[18px] w-[18px] shrink-0">
                    <Image
                      src={(team0Rank.rank.images.large_webp || team0Rank.rank.images.large)!}
                      alt={team0Rank.rank.name}
                      fill
                      sizes="18px"
                      className="object-contain"
                    />
                  </div>
                )}
                <span className="text-[10px]" style={{ color: ARCHMOTHER_COLOR }}>Archmother</span>
                <span className="text-xs font-heading" style={{ color: team0Rank.rank.color }}>
                  {team0Rank.rank.name} {team0Rank.subrank}
                </span>
              </div>
            )}
            {team1Rank && (
              <div className="flex items-center gap-1.5 glass-panel rounded-full px-3 py-1">
                {(team1Rank.rank.images.large_webp || team1Rank.rank.images.large) && (
                  <div className="relative h-[18px] w-[18px] shrink-0">
                    <Image
                      src={(team1Rank.rank.images.large_webp || team1Rank.rank.images.large)!}
                      alt={team1Rank.rank.name}
                      fill
                      sizes="18px"
                      className="object-contain"
                    />
                  </div>
                )}
                <span className="text-[10px]" style={{ color: HIDDEN_KING_COLOR }}>Hidden King</span>
                <span className="text-xs font-heading" style={{ color: team1Rank.rank.color }}>
                  {team1Rank.rank.name} {team1Rank.subrank}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-text-secondary">
          Winner:
        </span>
        <span
          className="glass-panel rounded-full px-4 py-2 font-mono text-sm"
          style={{
            color: winnerColor,
            animation: "pulse-glow 2s ease-in-out infinite",
            boxShadow: `0 0 15px ${winnerColor}25`,
          }}
        >
          <span
            className="mr-1.5 inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: winnerColor }}
          />
          {match.winning_team === "Team0" ? "Archmother" : "Hidden King"}
        </span>
      </div>
    </div>
  );
}
