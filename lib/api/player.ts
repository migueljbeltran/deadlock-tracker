import "server-only";

import { cache } from "react";
import type { SteamPlayerSummary } from "./types";
import { accountIdToSteam64, getPlayerSummary } from "./steam";

/**
 * Request-memoized player identity lookup so metadata and page content
 * can share the same Steam fetch during a single render pass.
 */
export const getPlayerIdentity = cache(async (
  accountId: number,
): Promise<SteamPlayerSummary | null> => {
  return getPlayerSummary(accountIdToSteam64(accountId));
});
