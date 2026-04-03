import type { PlayerMatchSummary } from "@/lib/api";

interface RecentFormProps {
  matches: PlayerMatchSummary[];
}

export function RecentForm({ matches }: RecentFormProps) {
  if (matches.length === 0) return null;

  // Determine W/L for each match
  const results = matches.map((match) => match.player_team === match.winning_team);

  // Current streak
  let streakCount = 1;
  const streakIsWin = results[0];
  for (let i = 1; i < results.length; i++) {
    if (results[i] === streakIsWin) {
      streakCount++;
    } else {
      break;
    }
  }

  // Recent record (from displayed matches)
  const wins = results.filter(Boolean).length;
  const losses = results.length - wins;

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {/* W/L dots */}
      <div className="flex items-center gap-1">
        {results.slice(0, 20).map((isWin, i) => (
          <div
            key={i}
            className={`h-2.5 w-2.5 rounded-full transition-all ${
              isWin
                ? "bg-soul shadow-[0_0_6px_rgba(61,220,132,0.5)]"
                : "bg-blood shadow-[0_0_6px_rgba(231,76,60,0.4)]"
            }`}
            title={isWin ? "Victory" : "Defeat"}
          />
        ))}
      </div>

      {/* Record */}
      <span className="font-mono text-xs text-text-secondary">
        <span className="text-soul">{wins}W</span>
        {" - "}
        <span className="text-blood">{losses}L</span>
      </span>

      {/* Streak */}
      {streakCount >= 2 && (
        <span
          className={`font-mono text-xs px-2 py-0.5 rounded-full border ${
            streakIsWin
              ? "text-soul border-soul/30 bg-soul/10"
              : "text-blood border-blood/30 bg-blood/10"
          }`}
        >
          {streakCount} {streakIsWin ? "Win" : "Loss"} Streak
        </span>
      )}
    </div>
  );
}
