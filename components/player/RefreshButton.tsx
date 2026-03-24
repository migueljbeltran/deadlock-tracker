"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const COOLDOWN_MS = 10_000;

export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [onCooldown, setOnCooldown] = useState(false);

  const handleRefresh = useCallback(() => {
    if (onCooldown) return;

    setOnCooldown(true);
    setTimeout(() => setOnCooldown(false), COOLDOWN_MS);

    startTransition(() => {
      router.refresh();
    });
  }, [onCooldown, router, startTransition]);

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
