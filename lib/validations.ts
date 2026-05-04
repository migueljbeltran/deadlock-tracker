import { z } from "zod";

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;
const STEAM_PROFILE_URL = /^https?:\/\/(www\.)?steamcommunity\.com\/(id|profiles)\/[^/?#\s]+\/?$/i;
const BARE_STEAM_PROFILE = /^(www\.)?steamcommunity\.com\/(id|profiles)\/[^/?#\s]+\/?$/i;

export const searchQuerySchema = z.object({
  q: z.string()
    .max(200, "Search query is too long")
    .trim()
    .min(1, "Search query is required")
    .refine((value) => !CONTROL_CHARS.test(value), "Search query contains invalid characters")
    .refine((value) => {
      if (!/^https?:\/\//i.test(value) && !/^steamcommunity\.com\//i.test(value) && !/^www\.steamcommunity\.com\//i.test(value)) {
        return true;
      }
      return STEAM_PROFILE_URL.test(value) || BARE_STEAM_PROFILE.test(value);
    }, "Only Steam profile URLs are supported"),
});

export const accountIdSchema = z.coerce
  .number()
  .int("Invalid account ID")
  .positive("Invalid account ID")
  .max(2_147_483_646, "Invalid account ID");

export const matchIdSchema = z.coerce
  .number()
  .int("Invalid match ID")
  .positive("Invalid match ID")
  .max(Number.MAX_SAFE_INTEGER, "Invalid match ID");

export const heroIdSchema = z.coerce
  .number()
  .int("Invalid hero ID")
  .positive("Invalid hero ID")
  .max(10_000, "Invalid hero ID");

export const regionSchema = z.enum(["NAmerica", "SAmerica", "Europe", "Asia", "Oceania"]);

export const rankParamSchema = z.coerce
  .number()
  .int("Invalid rank")
  .min(0, "Invalid rank")
  .max(11, "Invalid rank");

export const pageParamSchema = z.coerce
  .number()
  .int("Invalid page")
  .min(1, "Invalid page")
  .max(10_000, "Invalid page");

export const playerRefreshSchema = z.object({
  accountId: accountIdSchema,
  mode: z.enum(["manual", "background"]).default("manual"),
});
