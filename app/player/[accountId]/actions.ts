"use server";

import { revalidatePath } from "next/cache";

export async function refreshPlayerData(accountId: number) {
  revalidatePath(`/player/${accountId}`);
}
