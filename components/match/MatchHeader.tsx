import { formatDuration, formatTimeAgo } from "@/lib/utils/format";
import type { DeadlockMatchMetadata } from "@/lib/api";

interface MatchHeaderProps {
  match: DeadlockMatchMetadata;
}

export function MatchHeader({ match }: MatchHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
      <div className="text-center sm:text-left">
        <h1 className="font-display text-3xl text-amber tracking-wide sm:text-4xl">
          Match #{match.match_id}
        </h1>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-sm text-text-secondary sm:justify-start">
          <span>{match.game_mode}</span>
          <span className="text-text-muted">|</span>
          <span className="font-mono">{formatDuration(match.duration_s)}</span>
          <span className="text-text-muted">|</span>
          <span>{formatTimeAgo(match.start_time)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-text-secondary">
          Winner:
        </span>
        <span className="rounded border border-soul/30 bg-soul/10 px-3 py-1 font-mono text-sm text-soul animate-glow-shimmer">
          <span
            className="mr-1.5 inline-block h-2 w-2 rounded-full"
            style={{
              backgroundColor: match.winning_team === "Team0" ? "var(--amber)" : "var(--sigil)",
            }}
          />
          {match.winning_team === "Team0" ? "Amber Hand" : "Sapphire Flame"}
        </span>
      </div>
    </div>
  );
}
