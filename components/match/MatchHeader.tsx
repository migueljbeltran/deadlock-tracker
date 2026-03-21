import { formatDuration, formatTimeAgo } from "@/lib/utils/format";
import type { DeadlockMatchMetadata } from "@/lib/api";

interface MatchHeaderProps {
  match: DeadlockMatchMetadata;
}

export function MatchHeader({ match }: MatchHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
      <div className="text-center sm:text-left">
        <h1 className="font-display text-4xl tracking-wide sm:text-5xl bg-clip-text text-transparent bg-gradient-to-b from-amber-light via-amber to-amber/70">
          Match #{match.match_id}
        </h1>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-sm text-text-secondary sm:justify-start">
          <span className="inline-flex items-center rounded-full bg-[rgba(22,27,34,0.5)] backdrop-blur-sm border border-border-subtle px-3 py-1 text-xs font-mono text-text-secondary">
            {match.game_mode}
          </span>
          <span className="inline-flex items-center rounded-full bg-[rgba(22,27,34,0.5)] backdrop-blur-sm border border-border-subtle px-3 py-1 text-xs font-mono text-text-secondary">
            {formatDuration(match.duration_s)}
          </span>
          <span className="inline-flex items-center rounded-full bg-[rgba(22,27,34,0.5)] backdrop-blur-sm border border-border-subtle px-3 py-1 text-xs font-mono text-text-secondary">
            {formatTimeAgo(match.start_time)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-text-secondary">
          Winner:
        </span>
        <span
          className="glass-panel rounded-full px-4 py-2 font-mono text-sm text-soul animate-glow-shimmer"
          style={{ animation: "pulse-glow 2s ease-in-out infinite" }}
        >
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
