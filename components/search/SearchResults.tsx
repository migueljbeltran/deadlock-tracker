"use client";

import Image from "next/image";
import { Trophy } from "lucide-react";
import { SigilLoader } from "@/components/ui/SigilLoader";
import type { LeaderboardSearchResult, SearchResult, SteamSearchResult } from "@/lib/api/types";

interface SearchResultsProps {
  isLoading: boolean;
  results: SearchResult[];
  error: string | null;
  onSelect: (result: SearchResult) => void;
}

const REGION_SHORT: Record<string, string> = {
  NAmerica: "NA",
  SAmerica: "SA",
  Europe: "EU",
  Asia: "AS",
  Oceania: "OCE",
};

function SteamResultRow({ result, onSelect }: { result: SteamSearchResult; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex w-full items-center gap-3 p-3 text-left transition-all hover:bg-surface-elevated/50 hover:border-l-2 hover:border-l-soul hover:pl-4"
    >
      <Image
        src={result.avatar}
        alt={result.name}
        width={40}
        height={40}
        className="rounded border border-border-subtle"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-heading text-sm text-text-primary">
          {result.name}
        </p>
        <p className="font-mono text-xs text-text-muted">
          {result.accountId}
        </p>
      </div>
      <span className="text-xs text-soul transition-transform group-hover:translate-x-1">View Profile →</span>
    </button>
  );
}

function LeaderboardResultRow({ result, onSelect }: { result: LeaderboardSearchResult; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex w-full items-center gap-3 p-3 text-left transition-all hover:bg-surface-elevated/50 hover:border-l-2 hover:border-l-soul hover:pl-4"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded border border-border-subtle bg-surface-elevated/60">
        <Trophy className="h-5 w-5 text-amber" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-heading text-sm text-text-primary">
          {result.accountName}
        </p>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-amber">
            #{result.rank}
          </span>
          <span className="rounded-sm bg-surface-elevated/80 px-1.5 py-0.5 text-[10px] font-mono text-text-muted">
            {REGION_SHORT[result.region] ?? result.region}
          </span>
        </div>
      </div>
      <span className="text-xs text-soul transition-transform group-hover:translate-x-1">View Profile →</span>
    </button>
  );
}

export function SearchResults({ isLoading, results, error, onSelect }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 p-4">
        <SigilLoader size="sm" />
        <span className="text-sm text-text-secondary">Consulting the archives...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-sm text-blood">
        {error}
      </div>
    );
  }

  if (results.length === 0) return null;

  return (
    <div className="divide-y divide-border-subtle/30">
      {results.map((result) => {
        const key = `${result.source}-${result.accountId}`;
        if (result.source === "steam") {
          return (
            <SteamResultRow
              key={key}
              result={result}
              onSelect={() => onSelect(result)}
            />
          );
        }
        return (
          <LeaderboardResultRow
            key={key}
            result={result}
            onSelect={() => onSelect(result)}
          />
        );
      })}
    </div>
  );
}
