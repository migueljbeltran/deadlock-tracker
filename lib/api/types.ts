// ============================================================
// Steam Web API Types
// ============================================================

export interface SteamResolveVanityResponse {
  response: {
    steamid?: string;
    success: number; // 1 = success, 42 = no match
    message?: string;
  };
}

export interface SteamPlayerSummary {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatar: string; // 32x32
  avatarmedium: string; // 64x64
  avatarfull: string; // 184x184
  personastate: number; // 0=offline, 1=online, etc.
  communityvisibilitystate: number;
  lastlogoff?: number;
  realname?: string;
  loccountrycode?: string;
}

export interface SteamPlayerSummariesResponse {
  response: {
    players: SteamPlayerSummary[];
  };
}

// ============================================================
// Deadlock Assets API Types
// ============================================================

export interface DeadlockHeroDescription {
  lore?: string;
  role?: string;
  playstyle?: string;
}

export interface DeadlockHeroImages {
  icon_hero_card?: string;
  icon_hero_card_webp?: string;
  icon_image_small?: string;
  icon_image_small_webp?: string;
  minimap_image?: string;
  minimap_image_webp?: string;
  top_bar_image?: string;
  top_bar_image_webp?: string;
  top_bar_vertical_image?: string;
  top_bar_vertical_image_webp?: string;
  background_image?: string;
  background_image_webp?: string;
  [key: string]: string | undefined;
}

export interface DeadlockHero {
  id: number;
  class_name: string;
  name: string;
  description: DeadlockHeroDescription;
  player_selectable?: boolean;
  disabled?: boolean;
  in_development?: boolean;
  images?: DeadlockHeroImages;
}

export interface DeadlockItem {
  id: number;
  class_name: string;
  name: string;
  type?: string;
  image?: string;
  image_webp?: string;
  shop_image?: string;
  shop_image_webp?: string;
  cost?: number;
  item_tier?: number;
  item_slot_type?: string;
  shopable?: boolean;
  activation?: string;
  description?: Record<string, string>;
  heroes?: number[];
  properties?: Record<string, unknown>;
}

export interface DeadlockItemStats {
  item_id: number;
  bucket: number;
  wins: number;
  losses: number;
  matches: number;
  players: number;
  avg_buy_time_s: number;
  avg_sell_time_s: number;
  avg_buy_time_relative: number;
  avg_sell_time_relative: number;
}

export interface DeadlockRankImages {
  large?: string;
  large_webp?: string;
  [key: string]: string | undefined; // subrank variants (small_subrank1_webp, etc.)
}

export interface DeadlockRank {
  tier: number;
  name: string;
  color: string;
  images: DeadlockRankImages;
}

// ============================================================
// Deadlock Game Data API Types
// ============================================================

export interface DeadlockPlayerHeroStat {
  account_id: number;
  hero_id: number;
  matches_played: number;
  last_played: number;
  time_played: number;
  wins: number;
  ending_level: number;
  kills: number;
  deaths: number;
  assists: number;
  denies_per_match: number;
  kills_per_min: number;
  deaths_per_min: number;
  assists_per_min: number;
  networth_per_min: number;
  last_hits_per_min: number;
  damage_per_min: number;
  accuracy: number;
  matches: number[];
}

export interface DeadlockMatchPlayer {
  account_id: number;
  player_slot: number;
  team: string; // "Team0" or "Team1"
  hero_id: number;
  kills: number;
  deaths: number;
  assists: number;
  net_worth: number;
  last_hits: number;
  denies: number;
  player_level?: number;
  assigned_lane?: number;
  party?: number;
  abandon_match_time_s?: number;
}

export interface DeadlockMatchItemPurchase {
  game_time_s: number;
  item_id: number;
  upgrade_id: number;
  sold_time_s: number;
}

export interface DeadlockMatchMetadata {
  match_id: number;
  start_time: string;
  duration_s: number;
  winning_team: string; // "Team0" or "Team1"
  game_mode: string;
  match_mode: string;
  match_outcome: string;
  average_badge_team0?: number | null;
  average_badge_team1?: number | null;
  players?: DeadlockMatchPlayer[];
}

export interface DeadlockHeroAnalytics {
  hero_id: number;
  bucket: number;
  wins: number;
  losses: number;
  matches: number;
  players: number;
  total_kills: number;
  total_deaths: number;
  total_assists: number;
  total_net_worth: number;
  total_last_hits: number;
  total_denies: number;
  total_player_damage: number;
  total_player_damage_taken: number;
  total_boss_damage: number;
  total_creep_damage: number;
  total_neutral_damage: number;
  total_shots_hit: number;
  total_shots_missed: number;
  total_max_health: number;
}

export interface DeadlockPlayerMetrics {
  [metric: string]: {
    avg: number | null;
    std: number | null;
    percentile1: number | null;
    percentile5: number | null;
    percentile10: number | null;
    percentile25: number | null;
    percentile50: number | null;
    percentile75: number | null;
    percentile90: number | null;
    percentile95: number | null;
    percentile99: number | null;
  };
}

export interface PlayerMatchSummary {
  match_id: number;
  start_time: string;
  duration_s: number;
  winning_team: string;
  match_mode?: string;
  average_badge_team0?: number | null;
  average_badge_team1?: number | null;
  player_team?: string;
  hero_id?: number;
  kills?: number;
  deaths?: number;
  assists?: number;
}

export interface DeadlockLeaderboardEntry {
  account_name: string;
  possible_account_ids: number[];
  rank: number;
  top_hero_ids: number[];
  badge_level: number;
  ranked_rank: number;
  ranked_subrank: number;
}

// ============================================================
// Deadlock API Info
// ============================================================

export interface DeadlockApiInfo {
  fetched_matches_per_day: number;
  user_ingested_matches_last24h: number;
  table_sizes: {
    [table: string]: {
      is_view: boolean;
      rows: number;
      data_compressed_bytes: number;
      data_uncompressed_bytes: number;
    };
  };
}

export interface PlayerRankEstimate {
  tier: number;
  subrank: number;
}

export interface GlobalPlayerMetricThresholds {
  median: number | null;
  p75: number | null;
  p90: number | null;
  p95: number | null;
  mean?: number | null;
  sampleSize?: number | null;
}

export interface GlobalPlayerMetricsBenchmark {
  fetchedAt: string;
  metrics: Record<string, GlobalPlayerMetricThresholds>;
}

export interface PlayerSnapshot {
  player: SteamPlayerSummary;
  heroStats: DeadlockPlayerHeroStat[];
  matches: PlayerMatchSummary[];
  metrics: DeadlockPlayerMetrics | null;
  rankEstimate: PlayerRankEstimate | null;
  status: "complete" | "partial";
  fetchedAt: string;
}

export type PlayerSnapshotResponse =
  | {
    success: true;
    snapshot: PlayerSnapshot;
    benchmark: GlobalPlayerMetricsBenchmark | null;
    isStale: boolean;
    shouldRefresh: boolean;
  }
  | {
    success: false;
    error: string;
    notFound?: boolean;
  };

// ============================================================
// API Error
// ============================================================

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly endpoint: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
