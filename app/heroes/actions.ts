"use server";

import { revalidatePath } from "next/cache";

export async function refreshHeroesPage() {
  revalidatePath("/heroes");
}

export async function refreshTierList() {
  revalidatePath("/heroes/tier-list");
}
