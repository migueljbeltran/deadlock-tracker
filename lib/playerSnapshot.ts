import "server-only";

import type {
  PlayerSnapshot,
  DeadlockPlayerHeroStat,
  DeadlockMatchMetadata,
  DeadlockPlayerMetrics,
  PlayerMatchSummary,
} from "@/lib/api";
import { getPlayerIdentity, getPlayerHeroStats, getMatchHistory, getPlayerMetrics } from "@/lib/api";
import { cacheDelete, cacheGet, cacheSet, cacheSetIfNotExists, isCacheAvailable } from "@/lib/cache";
import logger from "@/lib/logger";

const FETCH_LIMIT = 61;

const SNAPSHOT_FRESHNESS_SECONDS = 86400;
const SNAPSHOT_TTL_SECONDS = 604800;
const REFRESH_LOCK_TTL_SECONDS = 180;
const MANUAL_REFRESH_COOLDOWN_SECONDS = 60;

function getSnapshotKey(accountId: number): string {
  return `player-snapshot:${accountId}`;
}

function getRefreshLockKey(accountId: number): string {
  return `player-refresh-lock:${accountId}`;
}

function getManualCooldownKey(accountId: number): string {
  return `player-refresh-cooldown:${accountId}`;
}

function estimateRankBadge(
  matches: {
    match_mode?: string;
    average_badge_team0?: number | null;
    average_badge_team1?: number | null;
    player_team?: string;
  }[],
): PlayerSnapshot["rankEstimate"] {
  const badges: number[] = [];
  const recentMatches = matches.slice(0, 10);

  for (const match of recentMatches) {
    if (match.match_mode === "PrivateLobby") continue;
    if (match.player_team) {
      const badge = match.player_team === "Team0"
        ? match.average_badge_team0
        : match.average_badge_team1;
      if (badge != null && badge > 0) badges.push(badge);
    } else {
      const b0 = match.average_badge_team0;
      const b1 = match.average_badge_team1;
      if (b0 != null && b0 > 0 && b1 != null && b1 > 0) {
        badges.push(Math.max(b0, b1));
      } else if (b0 != null && b0 > 0) {
        badges.push(b0);
      } else if (b1 != null && b1 > 0) {
        badges.push(b1);
      }
    }
  }

  if (badges.length === 0) return null;

  const avg = badges.reduce((sum, badge) => sum + badge, 0) / badges.length;
  return {
    tier: Math.floor(avg / 10),
    subrank: Math.min(6, Math.max(1, Math.round(avg % 10))),
  };
}

function toPlayerMatchSummary(
  match: DeadlockMatchMetadata,
  accountId: number,
): PlayerMatchSummary {
  const playerEntry = match.players?.find((player) => player.account_id === accountId);
  return {
    match_id: match.match_id,
    start_time: match.start_time,
    duration_s: match.duration_s,
    winning_team: match.winning_team,
    match_mode: match.match_mode,
    average_badge_team0: match.average_badge_team0,
    average_badge_team1: match.average_badge_team1,
    player_team: playerEntry?.team,
    hero_id: playerEntry?.hero_id,
    kills: playerEntry?.kills,
    deaths: playerEntry?.deaths,
    assists: playerEntry?.assists,
  };
}

function hasIncompleteMatchHistory(matches: PlayerMatchSummary[]): boolean {
  if (matches.length === 0) return false;

  const identifiedMatches = matches.filter((match) => match.hero_id != null).length;
  const attributedMatches = matches.filter((match) => match.player_team != null).length;

  return identifiedMatches === 0
    || attributedMatches === 0
    || identifiedMatches / matches.length < 0.5;
}

function normalizeSnapshot(snapshot: PlayerSnapshot): PlayerSnapshot {
  const matchDataIncomplete = snapshot.matchDataIncomplete ?? hasIncompleteMatchHistory(snapshot.matches);

  if (snapshot.matchDataIncomplete === matchDataIncomplete) {
    return snapshot;
  }

  return {
    ...snapshot,
    matchDataIncomplete,
  };
}

function isSnapshotStale(snapshot: PlayerSnapshot): boolean {
  const fetchedAt = Date.parse(snapshot.fetchedAt);
  if (Number.isNaN(fetchedAt)) return true;
  return (Date.now() - fetchedAt) / 1000 >= SNAPSHOT_FRESHNESS_SECONDS;
}

async function buildPlayerSnapshot(accountId: number): Promise<PlayerSnapshot | null> {
  const [
    player,
    heroStatsResult,
    matchesResult,
    metricsResult,
  ] = await Promise.all([
    getPlayerIdentity(accountId),
    getPlayerHeroStats(accountId).then(
      (value) => ({ ok: true as const, value }),
      (error) => ({ ok: false as const, error }),
    ),
    getMatchHistory(accountId, FETCH_LIMIT).then(
      (value) => ({ ok: true as const, value }),
      (error) => ({ ok: false as const, error }),
    ),
    getPlayerMetrics(accountId).then(
      (value) => ({ ok: true as const, value }),
      (error) => ({ ok: false as const, error }),
    ),
  ]);

  if (!player) return null;

  // Strip the `matches: number[]` array (all historical match IDs per hero) — it's never used
  // in the UI and can be hundreds of KB for veteran players, bloating Redis and API responses.
  const heroStats: DeadlockPlayerHeroStat[] = heroStatsResult.ok
    ? heroStatsResult.value.map((s) => ({ ...s, matches: [] }))
    : [];
  const matches = matchesResult.ok
    ? matchesResult.value.map((match) => toPlayerMatchSummary(match, accountId))
    : [];
  const matchDataIncomplete = matchesResult.ok && hasIncompleteMatchHistory(matches);
  const metrics: DeadlockPlayerMetrics | null = metricsResult.ok ? metricsResult.value : null;
  const status = heroStatsResult.ok && matchesResult.ok && metricsResult.ok && !matchDataIncomplete
    ? "complete"
    : "partial";

  const snapshot: PlayerSnapshot = {
    player,
    heroStats,
    matches,
    matchDataIncomplete,
    metrics,
    rankEstimate: matchesResult.ok && !matchDataIncomplete ? estimateRankBadge(matches) : null,
    status,
    fetchedAt: new Date().toISOString(),
  };

  return snapshot;
}

export async function getPlayerSnapshotState(accountId: number): Promise<{
  snapshot: PlayerSnapshot | null;
  isStale: boolean;
  shouldRefresh: boolean;
}> {
  const cacheKey = getSnapshotKey(accountId);
  const cached = await cacheGet<PlayerSnapshot>(cacheKey);

  if (cached) {
    // Retroactively strip the bloated `matches` arrays from snapshots that were cached
    // before this optimization — avoids waiting 7 days (TTL) for them to naturally expire.
    const stripped = {
      ...cached,
      heroStats: cached.heroStats.map((s) => ({ ...s, matches: [] })),
    };
    const snapshot = normalizeSnapshot(stripped);
    const isStale = isSnapshotStale(snapshot);
    const shouldRefresh = isStale || snapshot.status === "partial" || snapshot.matchDataIncomplete === true;
    logger.info({ accountId, isStale, status: snapshot.status, matchDataIncomplete: snapshot.matchDataIncomplete }, "Player snapshot cache hit");
    return { snapshot, isStale, shouldRefresh };
  }

  const builtSnapshot = await buildPlayerSnapshot(accountId);
  if (builtSnapshot) {
    await cacheSet(cacheKey, builtSnapshot, SNAPSHOT_TTL_SECONDS);
    logger.info(
      { accountId, status: builtSnapshot.status, matchDataIncomplete: builtSnapshot.matchDataIncomplete },
      "Player snapshot built on miss",
    );
  }

  return {
    snapshot: builtSnapshot,
    isStale: false,
    shouldRefresh: builtSnapshot?.status === "partial" || builtSnapshot?.matchDataIncomplete === true,
  };
}

export async function refreshPlayerSnapshot(
  accountId: number,
  mode: "manual" | "background" = "manual",
): Promise<{ refreshed: boolean; reason: "fresh" | "stale" | "locked" | "throttled" | "rebuilt" | "failed" | "not_found"; }> {
  const cacheKey = getSnapshotKey(accountId);
  let cooldownApplied = false;
  let refreshed = false;

  if (mode === "background") {
    const cached = await cacheGet<PlayerSnapshot>(cacheKey);
    const snapshot = cached ? normalizeSnapshot(cached) : null;
    if (snapshot && !isSnapshotStale(snapshot)) {
      return { refreshed: false, reason: "fresh" };
    }
  }

  if (isCacheAvailable() && mode === "manual") {
    cooldownApplied = await cacheSetIfNotExists(
      getManualCooldownKey(accountId),
      "1",
      MANUAL_REFRESH_COOLDOWN_SECONDS,
    );
    if (!cooldownApplied) {
      return { refreshed: false, reason: "throttled" };
    }
  }

  if (isCacheAvailable()) {
    const lockAcquired = await cacheSetIfNotExists(
      getRefreshLockKey(accountId),
      "1",
      REFRESH_LOCK_TTL_SECONDS,
    );
    if (!lockAcquired) {
      return { refreshed: false, reason: "locked" };
    }
  }

  try {
    let snapshot = await buildPlayerSnapshot(accountId);
    if (!snapshot) {
      return { refreshed: false, reason: "not_found" };
    }

    // If the rebuild returned degraded match data, preserve the existing cached matches.
    // This prevents a transient Deadlock API response (missing player entries) from
    // overwriting good match history that was already cached.
    if (snapshot.matchDataIncomplete || snapshot.matches.length === 0) {
      const existing = await cacheGet<PlayerSnapshot>(cacheKey);
      if (existing && !existing.matchDataIncomplete && existing.matches.length > 0) {
        snapshot = {
          ...snapshot,
          matches: existing.matches,
          matchDataIncomplete: false,
          rankEstimate: existing.rankEstimate,
        };
        logger.info({ accountId, mode }, "Player snapshot refresh: preserved cached match data over degraded rebuild");
      }
    }

    await cacheSet(cacheKey, snapshot, SNAPSHOT_TTL_SECONDS);
    refreshed = true;
    logger.info({ accountId, mode, status: snapshot.status }, "Player snapshot refreshed");
    return { refreshed: true, reason: "rebuilt" };
  } catch (error) {
    logger.warn({ accountId, mode, error }, "Player snapshot refresh failed");
    return { refreshed: false, reason: "failed" };
  } finally {
    if (isCacheAvailable()) {
      await cacheDelete(getRefreshLockKey(accountId));
      if (mode === "manual" && cooldownApplied && !refreshed) {
        await cacheDelete(getManualCooldownKey(accountId));
      }
    }
  }
}
