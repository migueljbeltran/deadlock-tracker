"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ChevronDown, Filter } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface RankOption {
  tier: number;
  name: string;
  color: string;
  imageUrl?: string;
}

interface RankFilterProps {
  ranks: RankOption[];
  currentMinTier: number | null;
  baseUrl: string;
}

export function RankFilter({ ranks, currentMinTier, baseUrl }: RankFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectTier(tier: number | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (tier == null) {
      params.delete("rank");
    } else {
      params.set("rank", String(tier));
    }
    const qs = params.toString();
    router.push(`${baseUrl}${qs ? `?${qs}` : ""}`);
    setOpen(false);
  }

  const selectedRank = currentMinTier != null
    ? ranks.find((r) => r.tier === currentMinTier)
    : null;

  const sortedRanks = [...ranks]
    .filter((r) => r.tier >= 1)
    .sort((a, b) => b.tier - a.tier);

  return (
    <div className="flex items-center gap-2" ref={ref}>
      <Filter className="h-3.5 w-3.5 text-text-muted" />
      <div className="relative">
        {/* Trigger button */}
        <button
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex items-center gap-2 h-9 rounded border bg-[rgba(22,27,34,0.92)] px-3 text-sm transition-all duration-200",
            open
              ? "border-soul ring-2 ring-soul-glow text-text-primary"
              : "border-border-subtle text-text-primary hover:border-soul/50",
          )}
        >
          {selectedRank?.imageUrl && (
            <div className="relative h-[18px] w-[18px] shrink-0">
              <Image
                src={selectedRank.imageUrl}
                alt={selectedRank.name}
                fill
                sizes="18px"
                className="object-contain"
              />
            </div>
          )}
          <span>{selectedRank ? `${selectedRank.name}+` : "All Ranks"}</span>
          <ChevronDown className={cn("h-3.5 w-3.5 text-text-muted transition-transform", open && "rotate-180")} />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 top-full mt-1 z-50 min-w-[180px] rounded-lg border border-border-subtle bg-[rgba(8,11,16,0.97)] shadow-lg overflow-hidden">
            <button
              onClick={() => selectTier(null)}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-surface/50",
                currentMinTier == null ? "text-soul bg-soul/10" : "text-text-primary",
              )}
            >
              All Ranks
            </button>
            {sortedRanks.map((r) => (
              <button
                key={r.tier}
                onClick={() => selectTier(r.tier)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-surface/50",
                  currentMinTier === r.tier ? "bg-soul/10" : "",
                )}
              >
                {r.imageUrl && (
                  <div className="relative h-[18px] w-[18px] shrink-0">
                    <Image
                      src={r.imageUrl}
                      alt={r.name}
                      fill
                      sizes="18px"
                      className="object-contain"
                    />
                  </div>
                )}
                <span style={{ color: currentMinTier === r.tier ? r.color : undefined }}>
                  {r.name}+
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
