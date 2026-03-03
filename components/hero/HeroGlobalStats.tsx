import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/format";

interface HeroGlobalStatsProps {
  winRate: number;
  pickRate: number;
  totalMatches: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  avgDamage: number;
  avgNetWorth: number;
}

function StatCard({ label, value, colorClass }: { label: string; value: string; colorClass?: string }) {
  return (
    <div className="flex flex-col items-center rounded border border-border-subtle bg-surface p-4 text-center">
      <span className={cn("font-mono text-2xl", colorClass ?? "text-text-primary")}>
        {value}
      </span>
      <span className="mt-1 text-xs uppercase tracking-wider text-text-secondary">
        {label}
      </span>
    </div>
  );
}

export function HeroGlobalStats({
  winRate,
  pickRate,
  totalMatches,
  avgKills,
  avgDeaths,
  avgAssists,
  avgDamage,
  avgNetWorth,
}: HeroGlobalStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        label="Win Rate"
        value={`${winRate.toFixed(1)}%`}
        colorClass={winRate >= 50 ? "text-soul" : "text-blood"}
      />
      <StatCard label="Pick Rate" value={`${pickRate.toFixed(1)}%`} colorClass="text-sigil" />
      <StatCard label="Matches" value={formatNumber(totalMatches)} />
      <StatCard label="Avg Kills" value={avgKills.toFixed(1)} colorClass="text-soul" />
      <StatCard label="Avg Deaths" value={avgDeaths.toFixed(1)} colorClass="text-blood" />
      <StatCard label="Avg Assists" value={avgAssists.toFixed(1)} colorClass="text-sigil" />
      <StatCard label="Avg Damage" value={formatNumber(Math.round(avgDamage))} />
      <StatCard label="Avg Net Worth" value={formatNumber(Math.round(avgNetWorth))} colorClass="text-amber" />
    </div>
  );
}
