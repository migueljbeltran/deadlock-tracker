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
      {/* Avatar with triple-ring effect */}
      <div className="relative">
        {/* Outer glow ring */}
        <div
          className="absolute -inset-4 rounded-full opacity-30 blur-md"
          style={{ background: "radial-gradient(circle, var(--soul-glow) 0%, transparent 70%)" }}
          aria-hidden="true"
        />
        {/* Middle ring */}
        <div className="absolute -inset-1 rounded-full border-2 border-soul opacity-60" aria-hidden="true" />
        {/* Inner ring */}
        <div className="absolute -inset-0.5 rounded-full border border-amber/30" aria-hidden="true" />
        <Image
          src={player.avatarfull}
          alt={player.personaname}
          width={120}
          height={120}
          className="relative rounded-full"
          style={{ boxShadow: "0 0 20px var(--soul-glow)" }}
          priority
        />
      </div>

      {/* Info */}
      <div className="flex flex-col items-center sm:items-start">
        <h1 className="font-display text-3xl text-text-primary">
          {player.personaname}
        </h1>
        <p className="font-mono text-xs text-text-muted mt-2 bg-[rgba(22,27,34,0.5)] backdrop-blur-sm border border-border-subtle rounded-full px-3 py-1 inline-block">
          ID: {accountId}
        </p>

        {/* Rank Badge */}
        {estimatedRank ? (
          <div className="mt-3 flex items-center gap-2 glass-panel rounded-lg px-3 py-2">
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
