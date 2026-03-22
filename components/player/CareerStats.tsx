import type { DeadlockPlayerHeroStat } from "@/lib/api";
import { formatNumber } from "@/lib/utils/format";
import { GlowCard } from "@/components/motion";

interface CareerStatsProps {
  heroStats: DeadlockPlayerHeroStat[];
}

export function CareerStats({ heroStats }: CareerStatsProps) {
  if (heroStats.length === 0) return null;

  const totals = heroStats.reduce(
    (acc, s) => ({
      matches: acc.matches + s.matches_played,
      wins: acc.wins + s.wins,
      kills: acc.kills + s.kills,
      deaths: acc.deaths + s.deaths,
      assists: acc.assists + s.assists,
      timePlayed: acc.timePlayed + s.time_played,
    }),
    { matches: 0, wins: 0, kills: 0, deaths: 0, assists: 0, timePlayed: 0 },
  );

  const winRate = totals.matches > 0
    ? (totals.wins / totals.matches) * 100
    : 0;
  const avgKills = totals.matches > 0
    ? (totals.kills / totals.matches).toFixed(1)
    : "0";
  const avgDeaths = totals.matches > 0
    ? (totals.deaths / totals.matches).toFixed(1)
    : "0";
  const avgAssists = totals.matches > 0
    ? (totals.assists / totals.matches).toFixed(1)
    : "0";
  const kda = totals.deaths > 0
    ? ((totals.kills + totals.assists) / totals.deaths).toFixed(2)
    : "Perfect";

  const hours = Math.floor(totals.timePlayed / 3600);
  const minutes = Math.floor((totals.timePlayed % 3600) / 60);
  const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  const stats = [
    {
      label: "Matches",
      value: formatNumber(totals.matches),
      sub: `${totals.wins}W - ${totals.matches - totals.wins}L`,
      color: "text-text-primary",
    },
    {
      label: "Win Rate",
      value: `${winRate.toFixed(1)}%`,
      sub: null,
      color: winRate >= 50 ? "text-soul" : "text-blood",
    },
    {
      label: "KDA Ratio",
      value: kda,
      sub: `${avgKills} / ${avgDeaths} / ${avgAssists}`,
      color: "text-amber",
    },
    {
      label: "Heroes Played",
      value: String(heroStats.length),
      sub: null,
      color: "text-sigil",
    },
    {
      label: "Time Played",
      value: timeStr,
      sub: null,
      color: "text-text-primary",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((stat) => (
        <GlowCard key={stat.label}>
          <div className="p-4 text-center">
            <p className="text-xs font-heading text-text-muted uppercase tracking-wider mb-1">
              {stat.label}
            </p>
            <p
              className={`font-mono text-2xl font-bold ${stat.color}`}
              style={{ textShadow: "0 0 15px rgba(212,168,83,0.15)" }}
            >
              {stat.value}
            </p>
            {stat.sub && (
              <p className="text-xs text-text-secondary mt-1 font-mono">
                {stat.sub}
              </p>
            )}
          </div>
        </GlowCard>
      ))}
    </div>
  );
}
