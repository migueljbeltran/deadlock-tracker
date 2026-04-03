"use client";

import { useEffect, useRef, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { refreshPlayerData } from "@/app/player/[accountId]/actions";

interface PlayerDataRecoveryProps {
  accountId: number;
  shouldRecover: boolean;
  isStale?: boolean;
  onRecovered?: () => void;
}

export function PlayerDataRecovery({
  accountId,
  shouldRecover,
  isStale = false,
  onRecovered,
}: PlayerDataRecoveryProps) {
  const [isPending, startTransition] = useTransition();
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (!shouldRecover || attemptedRef.current) return;

    attemptedRef.current = true;

    startTransition(async () => {
      const result = await refreshPlayerData(accountId, "background");
      if (result.refreshed) {
        onRecovered?.();
      } else if (result.reason === "failed") {
        attemptedRef.current = false;
      }
    });
  }, [accountId, onRecovered, shouldRecover, startTransition]);

  if (!shouldRecover) return null;

  return (
    <div className="mb-6 flex items-center gap-2 rounded-lg glass-panel px-4 py-3 text-sm text-text-secondary">
      {isPending ? <Loader2 className="h-4 w-4 animate-spin text-soul" /> : null}
      <span>
        {isPending
          ? "Refreshing cached player data..."
          : isStale
            ? "Showing cached player data while the archives refresh."
            : "Some player data is unavailable."}
      </span>
    </div>
  );
}
