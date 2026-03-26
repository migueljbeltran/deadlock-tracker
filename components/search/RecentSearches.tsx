"use client";

import Image from "next/image";
import { User, X } from "lucide-react";
import type { RecentSearch } from "@/lib/hooks/useRecentSearches";

interface RecentSearchesProps {
  searches: RecentSearch[];
  onSelect: (search: RecentSearch) => void;
  onClear?: () => void;
}

export function RecentSearches({ searches, onSelect, onClear }: RecentSearchesProps) {
  if (searches.length === 0) return null;

  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs text-text-muted uppercase tracking-wider">
          Recent Investigations
        </p>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-text-muted transition-colors hover:text-blood hover:bg-blood/10"
            aria-label="Clear recent searches"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {searches.map((search, i) => (
          <button
            key={`${search.accountId}-${i}`}
            type="button"
            onClick={() => onSelect(search)}
            className="group flex shrink-0 items-center gap-2 rounded-full border border-border-subtle bg-[rgba(22,27,34,0.92)] px-3 py-1.5 text-sm text-text-secondary transition-all hover:border-soul hover:text-soul"
          >
            {search.avatar ? (
              <Image
                src={search.avatar}
                alt={search.name}
                width={20}
                height={20}
                className="rounded-full transition-shadow group-hover:shadow-[0_0_8px_rgba(61,220,132,0.3)]"
              />
            ) : (
              <User className="h-5 w-5 text-text-muted transition-shadow group-hover:text-soul" />
            )}
            <span className="truncate max-w-[200px]">{search.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
