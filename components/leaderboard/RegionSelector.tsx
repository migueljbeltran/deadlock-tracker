"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import type { DeadlockRegion } from "@/lib/api";
import { cn } from "@/lib/utils/cn";

const REGIONS: { value: DeadlockRegion; label: string }[] = [
  { value: "NAmerica", label: "NA" },
  { value: "SAmerica", label: "SA" },
  { value: "Europe", label: "EU" },
  { value: "Asia", label: "Asia" },
  { value: "Oceania", label: "OCE" },
];

interface RegionSelectorProps {
  currentRegion: DeadlockRegion;
}

export function RegionSelector({ currentRegion }: RegionSelectorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <nav className={cn(
      "relative flex items-center gap-1 glass-panel rounded-lg p-1 transition-opacity",
      isPending && "opacity-60",
    )}>
      {REGIONS.map(({ value, label }) => (
        <button
          key={value}
          disabled={isPending}
          onClick={() => {
            startTransition(() => {
              router.push(`/leaderboard?region=${value}`);
            });
          }}
          className={cn(
            "relative z-10 rounded px-3 py-1.5 text-sm font-medium transition-colors",
            value === currentRegion
              ? "text-deep"
              : "text-text-secondary hover:text-text-primary",
          )}
        >
          {value === currentRegion && (
            <motion.div
              layoutId="region-indicator"
              className="absolute inset-0 rounded bg-soul shadow-[0_0_12px_rgba(61,220,132,0.3)]"
              style={{ zIndex: -1 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          {label}
        </button>
      ))}
      {isPending && (
        <Loader2 className="h-4 w-4 animate-spin text-amber mx-1" />
      )}
    </nav>
  );
}
