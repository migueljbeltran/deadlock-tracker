"use server";

import { revalidatePath } from "next/cache";
import { cacheDel } from "@/lib/cache";

export async function refreshPlayerData(accountId: number) {
  await cacheDel(`phs:${accountId}`, `pm:${accountId}`);
  revalidatePath(`/player/${accountId}`);
}
