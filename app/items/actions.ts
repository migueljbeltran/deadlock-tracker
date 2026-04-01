"use server";

import { revalidatePath } from "next/cache";

export async function refreshItems() {
  revalidatePath("/items");
}
