import "server-only";

import type { DeadlockLeaderboardEntry } from "@/lib/api/types";
import type { DeadlockRegion } from "@/lib/api/deadlock";
import { getLeaderboard } from "@/lib/api/deadlock";
import { resolveAccountIds } from "@/lib/api/resolve";
import { cacheDelete, cacheGet, cacheSet, cacheSetIfNotExists, isCacheAvailable } from "@/lib/cache";
import logger from "@/lib/logger";

const LEADERBOARD_PAGE_SIZE = 50;

export interface ResolvedLeaderboardEntry extends DeadlockLeaderboardEntry {
  profileAccountId: number | null;
  profileLinkStatus: "available" | "ambiguous" | "missing";
}

interface ResolvedLeaderboardSnapshot {
  fetchedAt: string;
  entries: ResolvedLeaderboardEntry[];
}

const SNAPSHOT_TTL_SECONDS = 604800;
// 2-day freshness: leaderboard shifts daily but perfect real-time accuracy isn't critical
const SNAPSHOT_FRESHNESS_SECONDS = 172800;
const SNAPSHOT_LOCK_TTL_SECONDS = 300;
const PROFILE_LINK_TTL_SECONDS = 604800;
const PROFILE_LINK_LOCK_TTL_SECONDS = 60;
const PROFILE_LINK_RESOLUTION_TIMEOUT_MS = 3500;

function getSnapshotKey(region: DeadlockRegion): string {
  return `leaderboard-snapshot:${region}:v1`;
}

function getSnapshotLockKey(region: DeadlockRegion): string {
  return `leaderboard-snapshot-refresh-lock:${region}`;
}

function getProfileLinksKey(region: DeadlockRegion, page: number): string {
  return `leaderboard-profile-links:${region}:page-${page}:v1`;
}

function getProfileLinksLockKey(region: DeadlockRegion, page: number): string {
  return `${getProfileLinksKey(region, page)}:refresh-lock`;
}

function isSnapshotStale(snapshot: ResolvedLeaderboardSnapshot): boolean {
  const fetchedAt = Date.parse(snapshot.fetchedAt);
  if (Number.isNaN(fetchedAt)) return true;
  return (Date.now() - fetchedAt) / 1000 >= SNAPSHOT_FRESHNESS_SECONDS;
}

function createSnapshot(entries: DeadlockLeaderboardEntry[]): ResolvedLeaderboardSnapshot {
  const resolvedEntries = entries.map((entry) => ({
    ...entry,
    profileAccountId: entry.possible_account_ids.length === 1
      ? entry.possible_account_ids[0]
      : null,
    profileLinkStatus: entry.possible_account_ids.length === 1
      ? "available" as const
      : entry.possible_account_ids.length > 1
        ? "ambiguous" as const
        : "missing" as const,
  }));

  return {
    fetchedAt: new Date().toISOString(),
    entries: resolvedEntries,
  };
}

async function buildResolvedLeaderboardSnapshot(region: DeadlockRegion): Promise<ResolvedLeaderboardSnapshot> {
  const entries = await getLeaderboard(region);
  const snapshot = createSnapshot(entries);

  await cacheSet(getSnapshotKey(region), snapshot, SNAPSHOT_TTL_SECONDS);
  logger.info({ region, entries: snapshot.entries.length }, "Resolved leaderboard snapshot rebuilt");
  return snapshot;
}

export async function getResolvedLeaderboard(region: DeadlockRegion): Promise<ResolvedLeaderboardEntry[]> {
  return (await getResolvedLeaderboardSnapshot(region)).entries;
}

interface ProfileLinkEntry {
  accountId: number;
}

type ProfileLinkMap = Record<number, ProfileLinkEntry>;

function getPageEntries(entries: ResolvedLeaderboardEntry[], page: number): ResolvedLeaderboardEntry[] {
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const offset = (safePage - 1) * LEADERBOARD_PAGE_SIZE;
  return entries.slice(offset, offset + LEADERBOARD_PAGE_SIZE);
}

function mergeProfileLinks(
  snapshot: ResolvedLeaderboardSnapshot,
  page: number,
  links: ProfileLinkMap | null,
): ResolvedLeaderboardSnapshot {
  if (!links || Object.keys(links).length === 0) return snapshot;

  const pageRanks = new Set(getPageEntries(snapshot.entries, page).map((entry) => entry.rank));
  return {
    ...snapshot,
    entries: snapshot.entries.map((entry) => {
      const link = links[entry.rank];
      if (!link || !pageRanks.has(entry.rank)) return entry;

      return {
        ...entry,
        profileAccountId: link.accountId,
        profileLinkStatus: "available",
      };
    }),
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Leaderboard profile link resolution timed out")), ms);
    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

async function resolveProfileLinksForPage(
  region: DeadlockRegion,
  entries: ResolvedLeaderboardEntry[],
  page: number,
): Promise<ProfileLinkMap | null> {
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const cacheKey = getProfileLinksKey(region, safePage);
  const cached = await cacheGet<ProfileLinkMap>(cacheKey);
  if (cached) return cached;

  const pageEntries = getPageEntries(entries, safePage);
  const ambiguousEntries = pageEntries
    .filter((entry) => entry.profileLinkStatus === "ambiguous")
    .map((entry) => ({
      rank: entry.rank,
      account_name: entry.account_name,
      possible_account_ids: entry.possible_account_ids,
      top_hero_ids: entry.top_hero_ids,
    }));

  if (ambiguousEntries.length === 0) return {};

  if (isCacheAvailable()) {
    const lockAcquired = await cacheSetIfNotExists(
      getProfileLinksLockKey(region, safePage),
      "1",
      PROFILE_LINK_LOCK_TTL_SECONDS,
    );
    if (!lockAcquired) return null;
  }

  try {
    const resolvedMap = await withTimeout(
      resolveAccountIds(ambiguousEntries),
      PROFILE_LINK_RESOLUTION_TIMEOUT_MS,
    );
    const links: ProfileLinkMap = {};

    for (let i = 0; i < ambiguousEntries.length; i++) {
      const resolved = resolvedMap.get(i);
      if (resolved?.confident) {
        links[ambiguousEntries[i].rank] = { accountId: resolved.accountId };
      }
    }

    await cacheSet(cacheKey, links, PROFILE_LINK_TTL_SECONDS);
    logger.info({
      region,
      page: safePage,
      resolvedLinks: Object.keys(links).length,
      ambiguousEntries: ambiguousEntries.length,
    }, "Leaderboard profile links resolved");
    return links;
  } catch (error) {
    logger.warn({ region, page: safePage, error }, "Leaderboard profile link resolution failed");
    return null;
  } finally {
    if (isCacheAvailable()) {
      await cacheDelete(getProfileLinksLockKey(region, safePage));
    }
  }
}

export async function getResolvedLeaderboardSnapshot(
  region: DeadlockRegion,
  options: { page?: number; enrichProfileLinks?: boolean } = {},
): Promise<ResolvedLeaderboardSnapshot> {
  if (!isCacheAvailable()) {
    const snapshot = await buildResolvedLeaderboardSnapshot(region);
    if (!options.enrichProfileLinks) return snapshot;
    return mergeProfileLinks(
      snapshot,
      options.page ?? 1,
      await resolveProfileLinksForPage(region, snapshot.entries, options.page ?? 1),
    );
  }

  const key = getSnapshotKey(region);
  const cached = await cacheGet<ResolvedLeaderboardSnapshot>(key);
  if (!cached) {
    const lockAcquired = await cacheSetIfNotExists(getSnapshotLockKey(region), "1", SNAPSHOT_LOCK_TTL_SECONDS);
    if (!lockAcquired) {
      logger.info({ region }, "Resolved leaderboard snapshot cold miss locked");
      const snapshot = createSnapshot(await getLeaderboard(region));
      if (!options.enrichProfileLinks) return snapshot;
      return mergeProfileLinks(
        snapshot,
        options.page ?? 1,
        await resolveProfileLinksForPage(region, snapshot.entries, options.page ?? 1),
      );
    }

    try {
      const snapshot = await buildResolvedLeaderboardSnapshot(region);
      if (!options.enrichProfileLinks) return snapshot;
      return mergeProfileLinks(
        snapshot,
        options.page ?? 1,
        await resolveProfileLinksForPage(region, snapshot.entries, options.page ?? 1),
      );
    } finally {
      await cacheDelete(getSnapshotLockKey(region));
    }
  }

  if (!isSnapshotStale(cached)) {
    if (!options.enrichProfileLinks) return cached;
    return mergeProfileLinks(
      cached,
      options.page ?? 1,
      await resolveProfileLinksForPage(region, cached.entries, options.page ?? 1),
    );
  }

  const lockAcquired = await cacheSetIfNotExists(getSnapshotLockKey(region), "1", SNAPSHOT_LOCK_TTL_SECONDS);
  if (!lockAcquired) {
    logger.info({ region }, "Resolved leaderboard snapshot stale; serving stale data");
    return cached;
  }

  try {
    const snapshot = await buildResolvedLeaderboardSnapshot(region);
    if (!options.enrichProfileLinks) return snapshot;
    return mergeProfileLinks(
      snapshot,
      options.page ?? 1,
      await resolveProfileLinksForPage(region, snapshot.entries, options.page ?? 1),
    );
  } catch (error) {
    logger.warn({ region, error }, "Resolved leaderboard snapshot rebuild failed; serving stale data");
    if (!options.enrichProfileLinks) return cached;
    return mergeProfileLinks(
      cached,
      options.page ?? 1,
      await resolveProfileLinksForPage(region, cached.entries, options.page ?? 1),
    );
  } finally {
    await cacheDelete(getSnapshotLockKey(region));
  }
}
