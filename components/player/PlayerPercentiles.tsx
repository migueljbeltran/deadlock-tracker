import type { DeadlockPlayerMetrics } from "@/lib/api";

interface PlayerPercentilesProps {
  metrics: DeadlockPlayerMetrics;
}

// Friendly names and display order for known metric keys
const METRIC_CONFIG: Record<string, { label: string; color: string; format?: (v: number) => string }> = {
  kills: { label: "Kills", color: "text-soul" },
  deaths: { label: "Deaths", color: "text-blood" },
  assists: { label: "Assists", color: "text-sigil" },
  damage: { label: "Damage", color: "text-amber" },
  player_damage: { label: "Player Damage", color: "text-amber" },
  net_worth: { label: "Net Worth", color: "text-amber", format: (v) => (v / 1000).toFixed(1) + "k" },
  last_hits: { label: "Last Hits", color: "text-text-primary" },
  denies: { label: "Denies", color: "text-text-primary" },
  healing: { label: "Healing", color: "text-sigil" },
  accuracy: { label: "Accuracy", color: "text-soul", format: (v) => (v * 100).toFixed(1) + "%" },
};

// Priority order for display
const PRIORITY_ORDER = [
  "kills", "deaths", "assists", "damage", "player_damage",
  "net_worth", "last_hits", "denies", "healing", "accuracy",
];

// Interpolate which percentile the player's avg falls at
function computePercentile(data: {
  percentile1: number; percentile5: number; percentile10: number;
  percentile25: number; percentile50: number; percentile75: number;
  percentile90: number; percentile95: number; percentile99: number;
}, avg: number): number {
  const thresholds = [
    { p: 1, v: data.percentile1 },
    { p: 5, v: data.percentile5 },
    { p: 10, v: data.percentile10 },
    { p: 25, v: data.percentile25 },
    { p: 50, v: data.percentile50 },
    { p: 75, v: data.percentile75 },
    { p: 90, v: data.percentile90 },
    { p: 95, v: data.percentile95 },
    { p: 99, v: data.percentile99 },
  ];

  // Below the lowest threshold
  if (avg <= thresholds[0].v) return 1;
  // Above the highest threshold
  if (avg >= thresholds[thresholds.length - 1].v) return 99;

  // Find the two surrounding thresholds and interpolate
  for (let i = 0; i < thresholds.length - 1; i++) {
    const lo = thresholds[i];
    const hi = thresholds[i + 1];
    if (avg >= lo.v && avg <= hi.v) {
      if (hi.v === lo.v) return lo.p;
      const t = (avg - lo.v) / (hi.v - lo.v);
      return lo.p + t * (hi.p - lo.p);
    }
  }

  return 50;
}

function getPercentileInfo(pct: number): { label: string; tier: string } {
  const topPct = Math.round(100 - pct);
  const label = `Top ${Math.max(1, topPct)}%`;

  if (pct >= 99) return { label, tier: "legendary" };
  if (pct >= 95) return { label, tier: "exceptional" };
  if (pct >= 90) return { label, tier: "excellent" };
  if (pct >= 75) return { label, tier: "good" };
  if (pct >= 50) return { label, tier: "average" };
  return { label: `Bottom ${Math.round(100 - pct)}%`, tier: "below" };
}

const TIER_STYLES: Record<string, string> = {
  legendary: "text-amber border-amber/40 bg-amber/10 shadow-[0_0_10px_rgba(212,168,83,0.3)]",
  exceptional: "text-amber border-amber/30 bg-amber/5",
  excellent: "text-soul border-soul/30 bg-soul/5",
  good: "text-sigil border-sigil/30 bg-sigil/5",
  average: "text-text-secondary border-border-subtle bg-surface/30",
  below: "text-text-muted border-border-subtle/50 bg-surface/20",
};

export function PlayerPercentiles({ metrics }: PlayerPercentilesProps) {
  const metricKeys = Object.keys(metrics);

  if (metricKeys.length === 0) return null;

  // Sort by priority, then alphabetically for unknowns
  const sortedKeys = metricKeys.sort((a, b) => {
    const ai = PRIORITY_ORDER.indexOf(a);
    const bi = PRIORITY_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });

  // Take top 8 most interesting metrics
  const displayKeys = sortedKeys.slice(0, 8);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {displayKeys.map((key) => {
        const data = metrics[key];
        const config = METRIC_CONFIG[key];
        const label = config?.label ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

        const pct = computePercentile(data, data.avg);
        const { label: percentileLabel, tier } = getPercentileInfo(pct);

        // Bar width based on computed percentile
        const barWidth = Math.min(100, Math.max(5, pct));

        return (
          <div key={key} className="glass-panel rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-text-muted font-heading uppercase tracking-wider truncate">
                {label}
              </span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full border ${TIER_STYLES[tier]}`}
              >
                {percentileLabel}
              </span>
            </div>

            <p className={`font-mono text-lg font-bold ${config?.color ?? "text-text-primary"}`}>
              {config?.format ? config.format(data.avg) : data.avg.toFixed(1)}
            </p>

            {/* Percentile bar */}
            <div className="mt-2 h-1.5 rounded-full bg-surface-elevated overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${barWidth}%`,
                  background: tier === "legendary" || tier === "exceptional"
                    ? "linear-gradient(90deg, var(--amber), var(--soul))"
                    : tier === "excellent" || tier === "good"
                      ? "linear-gradient(90deg, var(--soul-dim), var(--soul))"
                      : "var(--text-muted)",
                  boxShadow: tier === "legendary"
                    ? "0 0 8px rgba(212,168,83,0.4)"
                    : undefined,
                }}
              />
            </div>

            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-text-muted font-mono">
                Avg: {config?.format ? config.format(data.percentile50) : data.percentile50.toFixed(1)}
              </span>
              <span className="text-[9px] text-text-muted font-mono">
                Top 5%: {config?.format ? config.format(data.percentile95) : data.percentile95.toFixed(1)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
