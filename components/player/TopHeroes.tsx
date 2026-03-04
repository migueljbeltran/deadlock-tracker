import Image from "next/image";
import type { DeadlockPlayerHeroStat, DeadlockHero } from "@/lib/api";
import { GlowCard, StaggerList, StaggerItem } from "@/components/motion";

interface TopHeroesProps {
  heroStats: DeadlockPlayerHeroStat[];
  heroMap: Map<number, DeadlockHero>;
}

export function TopHeroes({ heroStats, heroMap }: TopHeroesProps) {
  if (heroStats.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        No hero data available yet. Play some matches to see stats here.
      </p>
    );
  }

  // Sort by matches played, take top 6
  const topHeroes = [...heroStats]
    .sort((a, b) => b.matches_played - a.matches_played)
    .slice(0, 6);

  return (
    <StaggerList className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {topHeroes.map((stat) => {
        const hero = heroMap.get(stat.hero_id);
        const winRate = stat.matches_played > 0
          ? (stat.wins / stat.matches_played) * 100
          : 0;
        const avgKills = stat.matches_played > 0
          ? (stat.kills / stat.matches_played).toFixed(1)
          : "0";
        const avgDeaths = stat.matches_played > 0
          ? (stat.deaths / stat.matches_played).toFixed(1)
          : "0";
        const avgAssists = stat.matches_played > 0
          ? (stat.assists / stat.matches_played).toFixed(1)
          : "0";

        return (
          <StaggerItem key={stat.hero_id}>
            <GlowCard>
              <div className="p-4">
                <div className="flex items-center gap-3">
                  {hero?.images?.icon_hero_card_webp ? (
                    <Image
                      src={hero.images.icon_hero_card_webp}
                      alt={hero.name}
                      width={48}
                      height={48}
                      className="rounded"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded bg-surface-elevated text-text-muted">
                      ?
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-heading text-sm text-text-primary">
                      {hero?.name ?? `Hero #${stat.hero_id}`}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {stat.matches_played} matches
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  {/* K/D/A */}
                  <div className="flex gap-1.5 text-xs">
                    <span className="font-mono text-soul">{avgKills}</span>
                    <span className="text-text-muted">/</span>
                    <span className="font-mono text-blood">{avgDeaths}</span>
                    <span className="text-text-muted">/</span>
                    <span className="font-mono text-sigil">{avgAssists}</span>
                  </div>

                  {/* Win Rate */}
                  <span
                    className={`font-mono text-xs ${
                      winRate >= 50 ? "text-soul" : "text-blood"
                    }`}
                  >
                    {winRate.toFixed(0)}% WR
                  </span>
                </div>

                {/* Win rate bar */}
                <div className="mt-2 h-1 w-full rounded-full bg-blood/30 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-soul"
                    style={{ width: `${winRate}%` }}
                  />
                </div>
              </div>
            </GlowCard>
          </StaggerItem>
        );
      })}
    </StaggerList>
  );
}
