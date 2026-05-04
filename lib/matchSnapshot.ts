import "server-only";

import { getMatchDetail, getMatchPlayerItems } from "@/lib/api/deadlock";
import { ApiError, type DeadlockMatchMetadata } from "@/lib/api/types";
import { cacheGet, cacheSet } from "@/lib/cache";
import logger from "@/lib/logger";

interface MatchSnapshot {
  fetchedAt: string;
  match: DeadlockMatchMetadata;
  playerItems: Array<[number, number[]]>;
}

const MATCH_SNAPSHOT_TTL_SECONDS = 2592000; // 30 days

function getMatchSnapshotKey(matchId: number): string {
  return `match-snapshot:${matchId}:v1`;
}

async function buildMatchSnapshot(matchId: number): Promise<MatchSnapshot> {
  const match = await getMatchDetail(matchId);
  const playerItemsMap = await getMatchPlayerItems(matchId).catch((error) => {
    logger.warn({ matchId, error }, "Match item lookup failed; caching metadata without items");
    return new Map<number, number[]>();
  });

  return {
    fetchedAt: new Date().toISOString(),
    match,
    playerItems: Array.from(playerItemsMap.entries()),
  };
}

export async function getMatchSnapshot(matchId: number): Promise<MatchSnapshot | null> {
  const cacheKey = getMatchSnapshotKey(matchId);
  const cached = await cacheGet<MatchSnapshot>(cacheKey);
  if (cached) return cached;

  try {
    const snapshot = await buildMatchSnapshot(matchId);
    await cacheSet(cacheKey, snapshot, MATCH_SNAPSHOT_TTL_SECONDS);
    logger.info({ matchId }, "Match snapshot built on miss");
    return snapshot;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      logger.info({ matchId }, "Match snapshot not found");
      return null;
    }

    logger.warn({ matchId, error }, "Match snapshot build failed");
    return null;
  }
}
