// Types
export type {
  SteamPlayerSummary,
  DeadlockHero,
  DeadlockHeroDescription,
  DeadlockHeroImages,
  DeadlockItem,
  DeadlockRank,
  DeadlockRankImages,
  DeadlockPlayerHeroStat,
  DeadlockMatchMetadata,
  DeadlockMatchPlayer,
  DeadlockHeroAnalytics,
  DeadlockPlayerMetrics,
  DeadlockLeaderboardEntry,
  DeadlockItemStats,
  DeadlockApiInfo,
} from "./types";

export { ApiError } from "./types";
export type { DeadlockRegion, LeaderboardSearchMatch } from "./deadlock";
export { resolveAccountIds } from "./resolve";
export type { ResolvableEntry, ResolvedAccount } from "./resolve";
export { getPlayerIdentity } from "./player";

// Steam API
export {
  resolveVanityURL,
  getPlayerSummaries,
  getPlayerSummary,
  steam64ToAccountId,
  accountIdToSteam64,
  isValidSteam64,
} from "./steam";

// Deadlock API
export {
  getHeroes,
  getHero,
  getItems,
  getItemStats,
  getRanks,
  getPlayerHeroStats,
  getBatchPlayerHeroStats,
  getMatchHistory,
  getMatchDetail,
  getMatchPlayerItems,
  getApiInfo,
  getHeroAnalytics,
  getPlayerMetrics,
  getLeaderboard,
  searchLeaderboardByName,
} from "./deadlock";
