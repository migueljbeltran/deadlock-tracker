"use client";

import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { ArtDecoDivider } from "@/components/layout/ArtDecoDivider";
import { PlayerHeader } from "@/components/player/PlayerHeader";
import { TopHeroes } from "@/components/player/TopHeroes";
import { CareerStats } from "@/components/player/CareerStats";
import { PlayerPercentiles } from "@/components/player/PlayerPercentiles";
import { PlayerMatchSection } from "@/components/player/PlayerMatchSection";
import { PlayerDataRecovery } from "@/components/player/PlayerDataRecovery";
import { FadeIn } from "@/components/motion";
import { SigilLoader } from "@/components/ui/SigilLoader";
import { usePlayerSnapshot } from "@/lib/hooks/usePlayerSnapshot";
import type { DeadlockHero, DeadlockRank, PlayerSnapshotResponse } from "@/lib/api";

interface PlayerContentProps {
  accountId: number;
  heroes: DeadlockHero[];
  ranks: DeadlockRank[];
  initialData?: PlayerSnapshotResponse;
}

export default function PlayerContent({ accountId, heroes, ranks, initialData }: PlayerContentProps) {
  const { data, isLoading, fetchError, refetch } = usePlayerSnapshot({ accountId, initialData });

  const heroMap = useMemo(
    () => new Map(heroes.map((hero) => [hero.id, hero])),
    [heroes],
  );
  const rankMap = useMemo(
    () => new Map(ranks.map((rank) => [rank.tier, rank])),
    [ranks],
  );

  if (isLoading && !data) {
    return (
      <div className="relative z-10 flex items-center justify-center py-32">
        <div className="glass-panel rounded-xl px-10 py-8 flex flex-col items-center gap-4 shadow-[var(--glow-soul-ambient)]">
          <SigilLoader size="lg" />
          <p className="font-heading text-text-secondary">
            Summoning soul records...
          </p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="relative z-10 mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-xl p-8 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-blood" />
          <p className="mt-4 text-text-secondary">{fetchError}</p>
          <button
            type="button"
            onClick={refetch}
            className="mt-6 inline-flex rounded-full glass-panel px-4 py-2 text-sm text-text-secondary transition-all hover:text-soul hover:border-soul/30"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data || !data.success) {
    return (
      <div className="relative z-10 mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-xl p-8 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-blood" />
          <p className="mt-4 text-text-secondary">{data?.error ?? "Player not found."}</p>
        </div>
      </div>
    );
  }

  const { snapshot, shouldRefresh, isStale } = data;
  const estimatedRank = snapshot.rankEstimate
    ? rankMap.get(snapshot.rankEstimate.tier) ?? null
    : null;
  const matchesUnavailable = snapshot.matchDataIncomplete === true
    || (snapshot.status === "partial" && snapshot.matches.length === 0);
  const heroStatsUnavailable = snapshot.status === "partial" && snapshot.heroStats.length === 0;
  const metricsUnavailable = snapshot.status === "partial" && snapshot.metrics == null;

  return (
    <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <PlayerDataRecovery
        accountId={accountId}
        shouldRecover={shouldRefresh}
        isStale={isStale}
        onRecovered={refetch}
      />

      <FadeIn triggerOnScroll={false}>
        <PlayerHeader
          player={snapshot.player}
          accountId={accountId}
          estimatedRank={estimatedRank}
          estimatedSubrank={snapshot.rankEstimate?.subrank ?? null}
          rankUnavailable={matchesUnavailable}
        />
      </FadeIn>

      {snapshot.heroStats.length > 0 && (
        <>
          <ArtDecoDivider className="my-8" />
          <section className="mb-8">
            <FadeIn delay={0.15}>
              <h2 className="font-heading text-xl text-amber mb-4">
                Career Overview
              </h2>
            </FadeIn>
            <FadeIn delay={0.2}>
              <CareerStats heroStats={snapshot.heroStats} />
            </FadeIn>
          </section>
        </>
      )}

      {heroStatsUnavailable ? (
        <>
          <ArtDecoDivider className="my-8" />
          <section className="mb-8">
            <FadeIn delay={0.2}>
              <div className="glass-panel rounded-xl p-6 text-sm text-text-secondary">
                Career stats are temporarily unavailable. Use refresh to retry.
              </div>
            </FadeIn>
          </section>
        </>
      ) : null}

      {snapshot.metrics && Object.keys(snapshot.metrics).length > 0 && (
        <>
          <ArtDecoDivider variant="simple" className="my-8" />
          <section className="mb-8">
            <FadeIn delay={0.25}>
              <h2 className="font-heading text-xl text-amber mb-4">
                Player Averages
              </h2>
            </FadeIn>
            <FadeIn delay={0.3}>
              <PlayerPercentiles metrics={snapshot.metrics} />
            </FadeIn>
          </section>
        </>
      )}

      {metricsUnavailable ? (
        <>
          <ArtDecoDivider variant="simple" className="my-8" />
          <section className="mb-8">
            <FadeIn delay={0.3}>
              <div className="glass-panel rounded-xl p-6 text-sm text-text-secondary">
                Performance metrics are temporarily unavailable. Use refresh to retry.
              </div>
            </FadeIn>
          </section>
        </>
      ) : null}

      <ArtDecoDivider className="my-8" />

      <section className="mb-8">
        <FadeIn delay={0.35}>
          <h2 className="font-heading text-xl text-amber mb-4">
            Top Heroes
          </h2>
        </FadeIn>
        <div className="glass-panel rounded-xl p-6">
          <TopHeroes
            heroStats={snapshot.heroStats}
            heroMap={Object.fromEntries(heroMap)}
          />
        </div>
      </section>

      <ArtDecoDivider variant="simple" className="my-8" />

      <PlayerMatchSection
        allMatches={snapshot.matches}
        accountId={accountId}
        heroEntries={heroes.map((hero) => ({
          id: hero.id,
          name: hero.name,
          iconUrl: hero.images?.icon_image_small_webp,
        }))}
        matchesUnavailable={matchesUnavailable}
        onRefresh={refetch}
      />
    </div>
  );
}
