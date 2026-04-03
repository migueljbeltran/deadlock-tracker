import type { DeadlockPlayerMetrics } from "@/lib/api";

interface PlayerPercentilesProps {
  metrics: DeadlockPlayerMetrics;
}

const METRIC_CONFIG: Record<string, { label: string; color: string; format?: (v: number) => string }> = {
  kills: { label: "Kills", color: "text-soul" },
  deaths: { label: "Deaths", color: "text-blood" },
  assists: { label: "Assists", color: "text-sigil" },
  damage: { label: "Damage", color: "text-amber" },
  player_damage: { label: "Player Damage", color: "text-amber" },
  net_worth: { label: "Net Worth", color: "text-amber", format: (v) => `${(v / 1000).toFixed(1)}k` },
  last_hits: { label: "Last Hits", color: "text-text-primary" },
  denies: { label: "Denies", color: "text-text-primary" },
  healing: { label: "Healing", color: "text-sigil" },
  accuracy: { label: "Accuracy", color: "text-soul", format: (v) => `${(v * 100).toFixed(1)}%` },
};

const PRIORITY_ORDER = [
  "kills", "deaths", "assists", "damage", "player_damage",
  "net_worth", "last_hits", "denies", "healing", "accuracy",
];

function formatMetricValue(value: number, formatter?: (value: number) => string): string {
  return formatter ? formatter(value) : value.toFixed(1);
}

export function PlayerPercentiles({ metrics }: PlayerPercentilesProps) {
  const validKeys = Object.keys(metrics)
    .filter((key) => metrics[key]?.avg != null)
    .sort((a, b) => {
      const ai = PRIORITY_ORDER.indexOf(a);
      const bi = PRIORITY_ORDER.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    })
    .slice(0, 8);

  if (validKeys.length === 0) return null;

  return (
    <div>
      <p className="mb-4 text-sm text-text-muted">
        Average per-match stats for this player.
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {validKeys.map((key) => {
          const data = metrics[key];
          if (data?.avg == null) return null;

          const config = METRIC_CONFIG[key];
          const label = config?.label ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

          return (
            <div key={key} className="glass-panel rounded-lg p-3">
              <span className="text-xs text-text-muted font-heading uppercase tracking-wider truncate">
                {label}
              </span>
              <p className={`mt-2 font-mono text-lg font-bold ${config?.color ?? "text-text-primary"}`}>
                {formatMetricValue(data.avg, config?.format)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
