"use client";

import { useState, useTransition, useCallback } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { refreshPlayerData } from "@/app/player/[accountId]/actions";

interface RefreshButtonProps {
  accountId: number;
  onRefreshed?: () => void;
}

export function RefreshButton({ accountId, onRefreshed }: RefreshButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = useCallback(() => {
    setError(null);

    startTransition(async () => {
      const result = await refreshPlayerData(accountId, "manual");
      if (result.refreshed) {
        onRefreshed?.();
        return;
      }

      if (result.reason === "throttled") {
        setError("Try again in a minute");
        return;
      }

      if (result.reason === "fresh") {
        setError("Already up to date");
        return;
      }

      if (result.reason === "locked") {
        setError("Refresh already running");
        return;
      }

      setError("Refresh failed");
    });
  }, [accountId, onRefreshed, startTransition]);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleRefresh}
        disabled={isPending}
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
      {error ? (
        <span className="inline-flex items-center gap-1 text-xs text-blood">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </span>
      ) : null}
    </div>
  );
}
