"use server";

import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/ratelimit";
import { refreshPlayerSnapshot } from "@/lib/playerSnapshot";
import { playerRefreshSchema } from "@/lib/validations";

export async function refreshPlayerData(
  accountId: number,
  mode: "manual" | "background" = "manual",
) {
  const parsed = playerRefreshSchema.safeParse({ accountId, mode });
  if (!parsed.success) {
    return { refreshed: false, reason: "failed" as const };
  }

  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-real-ip")
    ?? requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "127.0.0.1";
  const limit = await checkRateLimit("playerRefresh", ip);
  if (!limit.success) {
    return { refreshed: false, reason: "throttled" as const };
  }

  return refreshPlayerSnapshot(parsed.data.accountId, parsed.data.mode);
}
