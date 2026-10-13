"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import PlayerContent from "@/components/player/PlayerContent";
import type { DeadlockHero, DeadlockRank } from "@/lib/api/types";
import { accountIdSchema } from "@/lib/validations";

const subscribe = () => () => {};

export function PlayerProfileShell({ heroes, ranks }: { heroes: DeadlockHero[]; ranks: DeadlockRank[] }) {
  // beforeFiles rewrites retain the public /player/:id pathname in the browser.
  const routePathname = usePathname();
  // Rewrites render /player on the server and /player/:id in the browser.
  // Start with the same markup on hydration, then read the public pathname.
  const pathname = useSyncExternalStore(subscribe, () => routePathname, () => "");
  if (!pathname) return <p role="status" className="px-4 py-16 text-center text-text-secondary">Loading player profile…</p>;
  const parsed = accountIdSchema.safeParse(pathname.split("/")[2]);
  if (!parsed.success) {
    return <p className="mx-auto max-w-3xl px-4 py-16 text-text-secondary">Search for a player to view their stats.</p>;
  }
  return <PlayerContent key={parsed.data} accountId={parsed.data} heroes={heroes} ranks={ranks} />;
}
