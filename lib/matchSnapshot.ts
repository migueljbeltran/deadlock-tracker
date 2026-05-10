import "server-only";

import { getMatchDetail, getMatchPlayerItems } from "@/lib/api/deadlock";
import { ApiError, type DeadlockMatchMetadata } from "@/lib/api/types";
import { cacheGetOrBuildSnapshot } from "@/lib/cache";
import logger from "@/lib/logger";

interface MatchSnapshot {
  fetchedAt: string;
  match: DeadlockMatchMetadata;
  playerItems: Array<[number, number[]]>;
}

interface MatchSnapshotData {
  match: DeadlockMatchMetadata;
  playerItems: Array<[number, number[]]>;
}

const MATCH_SNAPSHOT_FRESHNESS_SECONDS = 2592000; // 30 days
const MATCH_SNAPSHOT_TTL_SECONDS = 7776000; // 90 days
const MATCH_SNAPSHOT_LOCK_TTL_SECONDS = 120;

function getMatchSnapshotKey(matchId: number): string {
  return `match-snapshot:${matchId}:v2`;
}

async function buildMatchSnapshot(matchId: number): Promise<MatchSnapshotData> {
  const match = await getMatchDetail(matchId);
  const playerItemsMap = await getMatchPlayerItems(matchId).catch((error) => {
    logger.warn({ matchId, error }, "Match item lookup failed; caching metadata without items");
    return new Map<number, number[]>();
  });

  return {
    match,
    playerItems: Array.from(playerItemsMap.entries()),
  };
}

export async function getMatchSnapshot(matchId: number): Promise<MatchSnapshot | null> {
  const cacheKey = getMatchSnapshotKey(matchId);

  try {
    const snapshot = await cacheGetOrBuildSnapshot({
      key: cacheKey,
      label: "match-snapshot",
      ttlSeconds: MATCH_SNAPSHOT_TTL_SECONDS,
      freshnessSeconds: MATCH_SNAPSHOT_FRESHNESS_SECONDS,
      lockTtlSeconds: MATCH_SNAPSHOT_LOCK_TTL_SECONDS,
      builder: () => buildMatchSnapshot(matchId),
    });
    if (!snapshot) return null;

    return {
      fetchedAt: snapshot.fetchedAt,
      ...snapshot.data,
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      logger.info({ matchId }, "Match snapshot not found");
      return null;
    }

    logger.warn({ matchId, error }, "Match snapshot build failed");
    return null;
  }
}
