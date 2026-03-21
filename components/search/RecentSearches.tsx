"use client";

import Image from "next/image";
import type { RecentSearch } from "@/lib/hooks/useRecentSearches";

interface RecentSearchesProps {
  searches: RecentSearch[];
  onSelect: (search: RecentSearch) => void;
}

export function RecentSearches({ searches, onSelect }: RecentSearchesProps) {
  if (searches.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="mb-2 text-xs text-text-muted uppercase tracking-wider">
        Recent Investigations
      </p>
      <div className="flex flex-wrap gap-2">
        {searches.map((search) => (
          <button
            key={search.accountId}
            type="button"
            onClick={() => onSelect(search)}
            className="group flex items-center gap-2 rounded-full border border-border-subtle bg-[rgba(22,27,34,0.5)] backdrop-blur-sm px-3 py-1.5 text-sm text-text-secondary transition-all hover:border-soul hover:text-soul"
          >
            <Image
              src={search.avatar}
              alt={search.name}
              width={20}
              height={20}
              className="rounded-full transition-shadow group-hover:shadow-[0_0_8px_rgba(61,220,132,0.3)]"
            />
            <span className="truncate max-w-[120px]">{search.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
