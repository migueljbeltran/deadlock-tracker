import { cn } from "@/lib/utils/cn";
import { StaggerList, StaggerItem, CountUp } from "@/components/motion";
import { WinRateCircle } from "./WinRateCircle";

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

const accentColors: Record<string, string> = {
  soul: "bg-soul",
  blood: "bg-blood",
  sigil: "bg-sigil",
  amber: "bg-amber",
  default: "bg-text-muted",
};

function StatCard({
  label,
  value,
  colorClass,
  accent = "default",
}: {
  label: string;
  value: number;
  colorClass?: string;
  accent?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded border border-border-subtle bg-surface p-4 text-center relative overflow-hidden">
      {/* Accent bar at top */}
      <div className={cn("absolute inset-x-0 top-0 h-0.5", accentColors[accent] ?? accentColors.default)} aria-hidden="true" />
      <span className={cn("font-mono text-2xl", colorClass ?? "text-text-primary")}>
        <CountUp value={value} />
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
    <StaggerList className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {/* Win Rate — special circular progress */}
      <StaggerItem>
        <div className="flex flex-col items-center rounded border border-border-subtle bg-surface p-4 text-center relative overflow-hidden">
          <div className={cn("absolute inset-x-0 top-0 h-0.5", winRate >= 50 ? "bg-soul" : "bg-blood")} aria-hidden="true" />
          <WinRateCircle winRate={winRate} />
          <span className="mt-1 text-xs uppercase tracking-wider text-text-secondary">
            Win Rate
          </span>
        </div>
      </StaggerItem>

      <StaggerItem>
        <div className="flex flex-col items-center rounded border border-border-subtle bg-surface p-4 text-center relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-sigil" aria-hidden="true" />
          <span className="font-mono text-2xl text-sigil">{pickRate.toFixed(1)}%</span>
          <span className="mt-1 text-xs uppercase tracking-wider text-text-secondary">Pick Rate</span>
        </div>
      </StaggerItem>

      <StaggerItem>
        <StatCard label="Matches" value={totalMatches} accent="default" />
      </StaggerItem>

      <StaggerItem>
        <StatCard label="Avg Kills" value={Number(avgKills.toFixed(1))} colorClass="text-soul" accent="soul" />
      </StaggerItem>

      <StaggerItem>
        <StatCard label="Avg Deaths" value={Number(avgDeaths.toFixed(1))} colorClass="text-blood" accent="blood" />
      </StaggerItem>

      <StaggerItem>
        <StatCard label="Avg Assists" value={Number(avgAssists.toFixed(1))} colorClass="text-sigil" accent="sigil" />
      </StaggerItem>

      <StaggerItem>
        <StatCard label="Avg Damage" value={Math.round(avgDamage)} accent="default" />
      </StaggerItem>

      <StaggerItem>
        <StatCard label="Avg Net Worth" value={Math.round(avgNetWorth)} colorClass="text-amber" accent="amber" />
      </StaggerItem>
    </StaggerList>
  );
}
