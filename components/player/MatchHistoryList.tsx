import Link from "next/link";
import Image from "next/image";
import type { PlayerMatchSummary, DeadlockHero } from "@/lib/api";
import { formatDuration, formatTimeAgo } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface MatchHistoryListProps {
  matches: PlayerMatchSummary[];
  heroMap: Map<number, DeadlockHero>;
}

export function MatchHistoryList({ matches, heroMap }: MatchHistoryListProps) {
  if (matches.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        No match history available. Play some matches to see results here.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {matches.map((match) => {
        const isVictory = match.player_team != null
          ? match.player_team === match.winning_team
          : false;
        const hero = match.hero_id != null ? heroMap.get(match.hero_id) : null;

        return (
          <Link
            key={match.match_id}
            href={`/match/${match.match_id}`}
            className={cn(
              "flex items-center gap-3 rounded-lg bg-[rgba(22,27,34,0.85)] border border-[rgba(48,54,61,0.6)] p-3 transition-all hover:border-soul hover:bg-surface-elevated hover:translate-x-1 sm:gap-4",
              "border-l-[3px]",
              isVictory
                ? "border-l-soul bg-soul/[0.03]"
                : "border-l-blood bg-blood/[0.03]",
            )}
          >
            {/* Result Badge */}
            <div className="flex-shrink-0">
              <span
                className={`inline-block rounded px-2 py-0.5 text-center font-mono text-xs border ${
                  isVictory
                    ? "border-soul/30 bg-soul/10 text-soul shadow-[0_0_8px_rgba(61,220,132,0.3)]"
                    : "border-blood/30 bg-blood/10 text-blood shadow-[0_0_8px_rgba(231,76,60,0.3)]"
                }`}
              >
                {isVictory ? "VICTORY" : "DEFEAT"}
              </span>
            </div>

            {/* Hero Icon */}
            {hero?.images?.icon_image_small_webp ? (
              <Image
                src={hero.images.icon_image_small_webp}
                alt={hero.name}
                width={32}
                height={32}
                className="rounded flex-shrink-0"
              />
            ) : (
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-surface-elevated text-xs text-text-muted">
                ?
              </div>
            )}

            {/* Hero Name */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-text-primary">
                {hero?.name ?? "Unknown Hero"}
              </p>
              <p className="text-xs text-text-muted">
                {formatTimeAgo(match.start_time)}
              </p>
            </div>

            {/* K/D/A */}
            {match.kills != null && match.deaths != null && match.assists != null && (
              <div className="flex items-center gap-1 text-xs">
                <span className="font-mono text-soul">{match.kills}</span>
                <span className="text-text-muted">/</span>
                <span className="font-mono text-blood">{match.deaths}</span>
                <span className="text-text-muted">/</span>
                <span className="font-mono text-sigil">{match.assists}</span>
              </div>
            )}

            {/* Duration */}
            <span className="flex-shrink-0 text-xs text-text-secondary font-mono">
              {formatDuration(match.duration_s)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
