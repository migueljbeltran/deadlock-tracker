"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { DeadlockPlayerHeroStat, DeadlockHero } from "@/lib/api";
import { cn } from "@/lib/utils/cn";
import { GlowCard, StaggerList, StaggerItem } from "@/components/motion";

interface TopHeroesProps {
  heroStats: DeadlockPlayerHeroStat[];
  heroMap: Record<string, DeadlockHero>;
}

const INITIAL_COUNT = 6;
/** Minimum matches for win rate sorting to avoid 1-game outliers */
const WIN_RATE_MIN_MATCHES = 3;

type SortMode = "played" | "winrate" | "kda";

const sortLabels: Record<SortMode, string> = {
  played: "Most Played",
  winrate: "Best Win Rate",
  kda: "Best KDA",
};

function getKda(stat: DeadlockPlayerHeroStat): number {
  if (stat.matches_played === 0) return 0;
  const avgDeaths = stat.deaths / stat.matches_played;
  // KDA = (K + A) / max(D, 1) — per-match averaged
  return avgDeaths > 0
    ? (stat.kills + stat.assists) / stat.deaths
    : stat.kills + stat.assists;
}

function getWinRate(stat: DeadlockPlayerHeroStat): number {
  return stat.matches_played > 0
    ? (stat.wins / stat.matches_played) * 100
    : 0;
}

export function TopHeroes({ heroStats, heroMap }: TopHeroesProps) {
  const [showAll, setShowAll] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("played");

  const sorted = useMemo(() => {
    if (heroStats.length === 0) return [];

    const copy = [...heroStats];
    switch (sortMode) {
      case "winrate":
        // Heroes with enough matches first, sorted by win rate desc.
        // Heroes below threshold go to the bottom, sorted by matches played.
        return copy.sort((a, b) => {
          const aQualifies = a.matches_played >= WIN_RATE_MIN_MATCHES;
          const bQualifies = b.matches_played >= WIN_RATE_MIN_MATCHES;
          if (aQualifies && !bQualifies) return -1;
          if (!aQualifies && bQualifies) return 1;
          if (!aQualifies && !bQualifies) return b.matches_played - a.matches_played;
          return getWinRate(b) - getWinRate(a);
        });
      case "kda":
        return copy.sort((a, b) => getKda(b) - getKda(a));
      case "played":
      default:
        return copy.sort((a, b) => b.matches_played - a.matches_played);
    }
  }, [heroStats, sortMode]);

  if (heroStats.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        No hero data available yet. Play some matches to see stats here.
      </p>
    );
  }

  const hasMore = sorted.length > INITIAL_COUNT;
  const visible = showAll ? sorted : sorted.slice(0, INITIAL_COUNT);

  return (
    <div>
      {/* Sort toggles */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        {(Object.keys(sortLabels) as SortMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => {
              setSortMode(mode);
              setShowAll(false);
            }}
            className={cn(
              "px-3 py-1.5 text-xs font-medium tracking-wide rounded-full border transition-all",
              sortMode === mode
                ? "border-soul text-soul bg-soul/10"
                : "border-border-subtle text-text-muted hover:text-text-secondary hover:border-border-subtle/80",
            )}
          >
            {sortLabels[mode]}
          </button>
        ))}
        {sortMode === "winrate" && (
          <span className="text-[10px] text-text-muted ml-1">
            ({WIN_RATE_MIN_MATCHES}+ matches)
          </span>
        )}
      </div>

      <StaggerList key={`${sortMode}-${showAll}`} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((stat, index) => {
          const hero = heroMap[stat.hero_id];
          const winRate = getWinRate(stat);
          const kda = getKda(stat);
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
                <div className="relative p-4">
                  <div className="absolute top-2 left-2 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-surface text-[10px] font-mono text-text-secondary border border-border-subtle">
                    {index + 1}
                  </div>
                  <div className="flex items-center gap-3">
                    {hero?.images?.icon_hero_card_webp ? (
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded">
                        <Image
                          src={hero.images.icon_hero_card_webp}
                          alt={hero.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-surface-elevated text-text-muted">
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
                      {sortMode === "kda" && (
                        <span className="font-mono text-amber ml-1">
                          ({kda.toFixed(2)})
                        </span>
                      )}
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
                  <div className="winrate-bar mt-2 w-full">
                    <div className="winrate-bar-fill" style={{ width: `${winRate}%` }} />
                  </div>

                  {/* Per-minute stats */}
                  <div className="mt-2 grid grid-cols-3 gap-x-2 gap-y-0.5 text-[10px] text-text-muted border-t border-border-subtle/30 pt-2">
                    <span title="Damage per minute">
                      DPM <span className="font-mono text-amber">{stat.damage_per_min.toFixed(0)}</span>
                    </span>
                    <span title="Net worth per minute">
                      GPM <span className="font-mono text-amber">{stat.networth_per_min.toFixed(0)}</span>
                    </span>
                    <span title="Last hits per minute">
                      LH/m <span className="font-mono text-text-secondary">{stat.last_hits_per_min.toFixed(1)}</span>
                    </span>
                  </div>
                </div>
              </GlowCard>
            </StaggerItem>
          );
        })}
      </StaggerList>

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium tracking-wide text-text-secondary border border-border-subtle rounded-md transition-all hover:border-soul hover:text-soul hover:bg-soul/5"
          >
            {showAll ? (
              <>
                Show Top {INITIAL_COUNT} <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Show All {sorted.length} Heroes <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
