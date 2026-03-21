"use client";

import Image from "next/image";
import { SigilLoader } from "@/components/ui/SigilLoader";

export interface SearchResultPlayer {
  accountId: number;
  name: string;
  avatar: string;
}

interface SearchResultsProps {
  isLoading: boolean;
  player: SearchResultPlayer | null;
  error: string | null;
  onSelect: (player: SearchResultPlayer) => void;
}

export function SearchResults({ isLoading, player, error, onSelect }: SearchResultsProps) {
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

  if (!player) return null;

  return (
    <button
      type="button"
      onClick={() => onSelect(player)}
      className="group flex w-full items-center gap-3 p-3 text-left transition-all hover:bg-surface-elevated/50 hover:border-l-2 hover:border-l-soul hover:pl-4"
    >
      <Image
        src={player.avatar}
        alt={player.name}
        width={40}
        height={40}
        className="rounded border border-border-subtle"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-heading text-sm text-text-primary">
          {player.name}
        </p>
        <p className="font-mono text-xs text-text-muted">
          {player.accountId}
        </p>
      </div>
      <span className="text-xs text-soul transition-transform group-hover:translate-x-1">View Profile →</span>
    </button>
  );
}
