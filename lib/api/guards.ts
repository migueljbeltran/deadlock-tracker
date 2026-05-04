import { z } from "zod";
import { ApiError } from "./types";
import logger from "@/lib/logger";

const stringMapSchema = z.record(z.string(), z.string().optional());
const numberMapSchema = z.record(z.string(), z.object({
  avg: z.number().nullable(),
  std: z.number().nullable(),
  percentile1: z.number().nullable(),
  percentile5: z.number().nullable(),
  percentile10: z.number().nullable(),
  percentile25: z.number().nullable(),
  percentile50: z.number().nullable(),
  percentile75: z.number().nullable(),
  percentile90: z.number().nullable(),
  percentile95: z.number().nullable(),
  percentile99: z.number().nullable(),
}).passthrough());

export const steamResolveVanityResponseSchema = z.object({
  response: z.object({
    steamid: z.string().optional(),
    success: z.number(),
    message: z.string().optional(),
  }).passthrough(),
}).passthrough();

export const steamPlayerSummarySchema = z.object({
  steamid: z.string(),
  personaname: z.string(),
  profileurl: z.string(),
  avatar: z.string(),
  avatarmedium: z.string(),
  avatarfull: z.string(),
  personastate: z.number(),
  communityvisibilitystate: z.number(),
  lastlogoff: z.number().optional(),
  realname: z.string().optional(),
  loccountrycode: z.string().optional(),
}).passthrough();

export const steamPlayerSummariesResponseSchema = z.object({
  response: z.object({
    players: z.array(steamPlayerSummarySchema),
  }).passthrough(),
}).passthrough();

export const deadlockHeroSchema = z.object({
  id: z.number(),
  class_name: z.string(),
  name: z.string(),
  description: z.object({
    lore: z.string().optional(),
    role: z.string().optional(),
    playstyle: z.string().optional(),
  }).passthrough(),
  player_selectable: z.boolean().optional(),
  disabled: z.boolean().optional(),
  in_development: z.boolean().optional(),
  images: stringMapSchema.optional(),
}).passthrough();

export const deadlockItemSchema = z.object({
  id: z.number(),
  class_name: z.string(),
  name: z.string(),
  type: z.string().optional(),
  image: z.string().optional(),
  image_webp: z.string().optional(),
  shop_image: z.string().optional(),
  shop_image_webp: z.string().optional(),
  cost: z.number().optional(),
  item_tier: z.number().optional(),
  item_slot_type: z.string().optional(),
  shopable: z.boolean().optional(),
  activation: z.string().optional(),
  description: z.record(z.string(), z.string()).optional(),
  heroes: z.array(z.number()).optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

export const deadlockRankSchema = z.object({
  tier: z.number(),
  name: z.string(),
  color: z.string(),
  images: stringMapSchema,
}).passthrough();

export const deadlockPlayerHeroStatSchema = z.object({
  account_id: z.number(),
  hero_id: z.number(),
  matches_played: z.number(),
  last_played: z.number(),
  time_played: z.number(),
  wins: z.number(),
  ending_level: z.number(),
  kills: z.number(),
  deaths: z.number(),
  assists: z.number(),
  denies_per_match: z.number(),
  kills_per_min: z.number(),
  deaths_per_min: z.number(),
  assists_per_min: z.number(),
  networth_per_min: z.number(),
  last_hits_per_min: z.number(),
  damage_per_min: z.number(),
  accuracy: z.number(),
  matches: z.array(z.number()),
}).passthrough();

export const deadlockMatchPlayerSchema = z.object({
  account_id: z.number(),
  player_slot: z.number(),
  team: z.string(),
  hero_id: z.number(),
  kills: z.number(),
  deaths: z.number(),
  assists: z.number(),
  net_worth: z.number(),
  last_hits: z.number(),
  denies: z.number(),
  player_level: z.number().optional(),
  assigned_lane: z.number().optional(),
  party: z.number().optional(),
  abandon_match_time_s: z.number().optional(),
}).passthrough();

export const deadlockMatchMetadataSchema = z.object({
  match_id: z.number(),
  start_time: z.string(),
  duration_s: z.number(),
  winning_team: z.string(),
  game_mode: z.string(),
  match_mode: z.string(),
  match_outcome: z.string(),
  average_badge_team0: z.number().nullable().optional(),
  average_badge_team1: z.number().nullable().optional(),
  players: z.array(deadlockMatchPlayerSchema).optional(),
}).passthrough();

export const deadlockMatchItemPurchaseSchema = z.object({
  game_time_s: z.number(),
  item_id: z.number(),
  upgrade_id: z.number(),
  sold_time_s: z.number(),
}).passthrough();

export const rawMatchDetailSchema = z.object({
  match_info: z.object({
    players: z.array(z.object({
      account_id: z.number(),
      items: z.array(deadlockMatchItemPurchaseSchema).optional(),
    }).passthrough()),
  }).passthrough(),
}).passthrough();

export const deadlockHeroAnalyticsSchema = z.object({
  hero_id: z.number(),
  bucket: z.number(),
  wins: z.number(),
  losses: z.number(),
  matches: z.number(),
  players: z.number(),
  total_kills: z.number(),
  total_deaths: z.number(),
  total_assists: z.number(),
  total_net_worth: z.number(),
  total_last_hits: z.number(),
  total_denies: z.number(),
  total_player_damage: z.number(),
  total_player_damage_taken: z.number(),
  total_boss_damage: z.number(),
  total_creep_damage: z.number(),
  total_neutral_damage: z.number(),
  total_shots_hit: z.number(),
  total_shots_missed: z.number(),
  total_max_health: z.number(),
}).passthrough();

export const deadlockItemStatsSchema = z.object({
  item_id: z.number(),
  bucket: z.number(),
  wins: z.number(),
  losses: z.number(),
  matches: z.number(),
  players: z.number(),
  avg_buy_time_s: z.number(),
  avg_sell_time_s: z.number(),
  avg_buy_time_relative: z.number(),
  avg_sell_time_relative: z.number(),
}).passthrough();

export const deadlockLeaderboardEntrySchema = z.object({
  account_name: z.string(),
  possible_account_ids: z.array(z.number()),
  rank: z.number(),
  top_hero_ids: z.array(z.number()),
  badge_level: z.number(),
  ranked_rank: z.number(),
  ranked_subrank: z.number(),
}).passthrough();

export const deadlockLeaderboardResponseSchema = z.object({
  entries: z.array(deadlockLeaderboardEntrySchema),
}).passthrough();

export const deadlockApiInfoSchema = z.object({
  fetched_matches_per_day: z.number(),
  user_ingested_matches_last24h: z.number(),
  table_sizes: z.record(z.string(), z.object({
    is_view: z.boolean(),
    rows: z.number(),
    data_compressed_bytes: z.number(),
    data_uncompressed_bytes: z.number(),
  }).passthrough()),
}).passthrough();

export const deadlockPlayerMetricsSchema = numberMapSchema;

export function parseExternalData<T>(schema: z.ZodType<T>, data: unknown, label: string): T {
  const parsed = schema.safeParse(data);
  if (parsed.success) return parsed.data;

  logger.error(
    {
      label,
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    },
    "External API returned malformed data",
  );
  throw new ApiError(`Malformed upstream response: ${label}`, 502, label);
}
