"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { MatchHistoryList } from "@/components/player/MatchHistoryList";
import { RecentForm } from "@/components/player/RecentForm";
import { Pagination } from "@/components/ui/Pagination";
import { RefreshButton } from "@/components/player/RefreshButton";
import { FadeIn } from "@/components/motion";
import type { PlayerMatchSummary, DeadlockHero } from "@/lib/api";

const MATCH_PAGE_SIZE = 20;
const MAX_MATCH_PAGES = 5;

interface HeroEntry {
  id: number;
  name: string;
  iconUrl?: string;
}

interface PlayerMatchSectionProps {
  allMatches: PlayerMatchSummary[];
  accountId: number;
  heroEntries: HeroEntry[];
  matchesUnavailable?: boolean;
  onRefresh?: () => void;
}

export function PlayerMatchSection({
  allMatches,
  accountId,
  heroEntries,
  matchesUnavailable = false,
  onRefresh,
}: PlayerMatchSectionProps) {
  const searchParams = useSearchParams();
  const pageParam = searchParams.get("page");

  const rawPage = Number(pageParam);
  const page = Number.isInteger(rawPage) && rawPage > 0
    ? Math.min(rawPage, MAX_MATCH_PAGES)
    : 1;

  const offset = (page - 1) * MATCH_PAGE_SIZE;
  const pageMatches = allMatches.slice(offset, offset + MATCH_PAGE_SIZE);
  const hasNextPage = allMatches.length > offset + MATCH_PAGE_SIZE;

  const heroMap = useMemo(
    () => new Map<number, DeadlockHero>(
      heroEntries.map((h) => [
        h.id,
        { name: h.name, images: { icon_image_small_webp: h.iconUrl } } as DeadlockHero,
      ]),
    ),
    [heroEntries],
  );

  return (
    <section>
      <FadeIn delay={0.4}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h2 className="font-heading text-xl text-amber">
              Match History
            </h2>
            <RefreshButton accountId={accountId} onRefreshed={onRefresh} />
          </div>
          {!matchesUnavailable ? <RecentForm matches={allMatches.slice(0, 20)} /> : null}
        </div>
      </FadeIn>
      <div className="glass-panel rounded-xl p-6">
        {matchesUnavailable ? (
          <div className="rounded-lg border border-border-subtle bg-surface-elevated/30 px-4 py-5 text-sm text-text-secondary">
            Match history is temporarily unavailable. Use refresh to retry.
          </div>
        ) : (
          <MatchHistoryList
            matches={pageMatches}
            heroMap={heroMap}
          />
        )}
        <Pagination
          currentPage={page}
          hasNextPage={!matchesUnavailable && hasNextPage}
          baseUrl={`/player/${accountId}`}
        />
      </div>
    </section>
  );
}
