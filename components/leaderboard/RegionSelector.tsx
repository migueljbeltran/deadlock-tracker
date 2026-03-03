import Link from "next/link";
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
  return (
    <nav className="flex gap-1 rounded border border-border-subtle bg-surface p-1">
      {REGIONS.map(({ value, label }) => (
        <Link
          key={value}
          href={`/leaderboard?region=${value}`}
          className={cn(
            "rounded px-3 py-1.5 text-sm font-medium transition-all",
            value === currentRegion
              ? "bg-soul text-deep"
              : "text-text-secondary hover:bg-surface-elevated hover:text-text-primary",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
