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
      {/* Avatar with mystical soul-glow aura */}
      <div className="relative">
        <div
          className="absolute -inset-3 rounded-full opacity-40 blur-xl"
          style={{ background: "radial-gradient(circle, var(--soul-glow) 0%, transparent 70%)" }}
          aria-hidden="true"
        />
        <Image
          src={player.avatarfull}
          alt={player.personaname}
          width={96}
          height={96}
          className="relative rounded border-2 border-soul animate-sigil-pulse"
          style={{ boxShadow: "0 0 20px var(--soul-glow)" }}
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
            {(estimatedRank.images.large_webp || estimatedRank.images.large) && (
              <Image
                src={(estimatedRank.images.large_webp || estimatedRank.images.large)!}
                alt={estimatedRank.name}
                width={28}
                height={28}
                className="drop-shadow-lg animate-float"
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
