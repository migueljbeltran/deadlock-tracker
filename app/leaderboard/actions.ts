"use server";

import { revalidatePath } from "next/cache";
import { cacheDel } from "@/lib/cache";

export async function refreshLeaderboard(region: string) {
  await cacheDel(`lb:${region}`);
  revalidatePath("/leaderboard");
}
