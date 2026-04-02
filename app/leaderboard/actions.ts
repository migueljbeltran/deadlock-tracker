"use server";

import { revalidatePath } from "next/cache";

export async function refreshLeaderboard(region: string) {
  revalidatePath("/leaderboard");
}
