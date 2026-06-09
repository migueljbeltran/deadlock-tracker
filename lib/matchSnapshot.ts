import "server-only";

import { getMatchDetail, getMatchPlayerItems } from "@/lib/api/deadlock";
import { ApiError, type DeadlockMatchMetadata } from "@/lib/api/types";
import logger from "@/lib/logger";

interface MatchSnapshot {
  fetchedAt: string;
  match: DeadlockMatchMetadata;
  playerItems: Array<[number, number[]]>;
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
  try {
    return await buildMatchSnapshot(matchId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      logger.info({ matchId }, "Match snapshot not found");
      return null;
    }

    logger.warn({ matchId, error }, "Match snapshot build failed");
    return null;
  }
}
