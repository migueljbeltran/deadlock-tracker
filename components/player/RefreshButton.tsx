"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lastRefresh, setLastRefresh] = useState<number | null>(null);

  function handleRefresh() {
    // Cooldown: prevent spamming (10 seconds)
    if (lastRefresh && Date.now() - lastRefresh < 10_000) return;

    setLastRefresh(Date.now());
    startTransition(() => {
      router.refresh();
    });
  }

  const onCooldown = lastRefresh != null && Date.now() - lastRefresh < 10_000;

  return (
    <button
      onClick={handleRefresh}
      disabled={isPending || onCooldown}
      title="Refresh match data"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full glass-panel px-3 py-1.5 text-xs text-text-secondary transition-all",
        "hover:text-soul hover:border-soul/30",
        "disabled:opacity-50 disabled:cursor-not-allowed",
      )}
    >
      <RefreshCw className={cn("h-3 w-3", isPending && "animate-spin")} />
      {isPending ? "Refreshing..." : "Refresh"}
    </button>
  );
}
