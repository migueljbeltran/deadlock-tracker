import Image from "next/image";
import type { SteamPlayerSummary, DeadlockRank } from "@/lib/api";

interface PlayerHeaderProps {
  player: SteamPlayerSummary;
  accountId: number;
  estimatedRank: DeadlockRank | null;
}

export function PlayerHeader({ player, accountId, estimatedRank }: PlayerHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
      {/* Avatar */}
      <div className="relative">
        <Image
          src={player.avatarfull}
          alt={player.personaname}
          width={96}
          height={96}
          className="rounded border-2 border-soul shadow-glow-soul"
          priority
        />
      </div>

      {/* Info */}
      <div className="flex flex-col items-center sm:items-start">
        <h1 className="font-heading text-2xl text-text-primary">
          {player.personaname}
        </h1>
        <p className="font-mono text-sm text-text-muted mt-1">
          ID: {accountId}
        </p>

        {/* Rank Badge */}
        {estimatedRank ? (
          <div className="mt-3 flex items-center gap-2">
            {(estimatedRank.images.small_webp || estimatedRank.images.small) && (
              <Image
                src={estimatedRank.images.small_webp || estimatedRank.images.small}
                alt={estimatedRank.name}
                width={28}
                height={28}
                className="drop-shadow-lg"
              />
            )}
            <span
              className="font-heading text-sm"
              style={{ color: estimatedRank.color }}
            >
              {estimatedRank.name}
            </span>
            <span className="text-xs text-text-muted">(Estimated)</span>
          </div>
        ) : (
          <p className="mt-3 text-sm text-text-muted">Unranked</p>
        )}
      </div>
    </div>
  );
}
