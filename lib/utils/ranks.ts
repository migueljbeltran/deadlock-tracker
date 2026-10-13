import type { DeadlockRank } from "@/lib/api/types";

export function getRankImage(rank: DeadlockRank, subrank?: number | null): string | undefined {
  return (subrank ? rank.images[`subrank${subrank}_webp`] || rank.images[`subrank${subrank}`] || rank.images[`small_subrank${subrank}_webp`] : undefined)
    || rank.images.large_webp || rank.images.large;
}
