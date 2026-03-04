"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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

  return (
    <nav className="relative flex gap-1 rounded border border-border-subtle bg-surface p-1">
      {REGIONS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => router.push(`/leaderboard?region=${value}`)}
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
              className="absolute inset-0 rounded bg-soul"
              style={{ zIndex: -1 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          {label}
        </button>
      ))}
    </nav>
  );
}
