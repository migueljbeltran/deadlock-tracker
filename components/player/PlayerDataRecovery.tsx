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
  const retryTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    attemptedRef.current = false;
    if (retryTimeoutRef.current != null) {
      window.clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, [accountId]);

  useEffect(() => {
    if (!shouldRecover) {
      attemptedRef.current = false;
      if (retryTimeoutRef.current != null) {
        window.clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    }
  }, [shouldRecover]);

  useEffect(() => {
    if (!shouldRecover || attemptedRef.current) return;

    attemptedRef.current = true;
    let cancelled = false;

    startTransition(async () => {
      const result = await refreshPlayerData(accountId, "background");
      if (cancelled) return;

      if (result.refreshed) {
        onRecovered?.();
        return;
      }

      if (result.reason === "locked") {
        // A rebuild is already in progress — poll after a short delay
        retryTimeoutRef.current = window.setTimeout(() => {
          retryTimeoutRef.current = null;
          if (cancelled) return;
          attemptedRef.current = false;
          onRecovered?.();
        }, 1500);
        return;
      }

      // "fresh": snapshot is not stale, no automatic rebuild will happen.
      // Stop here — show the static unavailable banner without looping.
      // The user can force a rebuild via the manual refresh button.

      if (result.reason === "failed") {
        attemptedRef.current = false;
      }
    });

    return () => {
      cancelled = true;
      if (retryTimeoutRef.current != null) {
        window.clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
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
