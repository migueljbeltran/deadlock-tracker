"use server";

import { refreshPlayerSnapshot } from "@/lib/playerSnapshot";

export async function refreshPlayerData(
  accountId: number,
  mode: "manual" | "background" = "manual",
) {
  return refreshPlayerSnapshot(accountId, mode);
}
