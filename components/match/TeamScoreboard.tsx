import Link from "next/link";
import Image from "next/image";
import { Crown } from "lucide-react";
import type { DeadlockMatchPlayer, DeadlockHero } from "@/lib/api";
import { formatNumber } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface TeamScoreboardProps {
  teamLabel: string;
  players: DeadlockMatchPlayer[];
  heroMap: Map<number, DeadlockHero>;
  playerNameMap: Map<number, string>;
  isWinner: boolean;
}

export function TeamScoreboard({
  teamLabel,
  players,
  heroMap,
  playerNameMap,
  isWinner,
}: TeamScoreboardProps) {
  // Find top killer on this team
  const maxKills = Math.max(...players.map((p) => p.kills));

  return (
    <div className={cn(
      "overflow-x-auto rounded border",
      isWinner
        ? "border-soul/40 shadow-glow-soul"
        : "border-border-subtle",
    )}>
      <table className="w-full text-sm">
        <thead>
          <tr className={cn(
            "border-b-2 text-left uppercase tracking-[0.05em] text-xs",
            isWinner
              ? "border-soul bg-soul/10 text-soul"
              : "border-blood bg-blood/10 text-blood",
          )}>
            <th className="px-3 py-2 sm:px-4">
              {isWinner && <Crown className="mr-1.5 inline-block h-3.5 w-3.5 -translate-y-px" />}
              {teamLabel}
              {isWinner && <span className="ml-2 text-[10px] normal-case tracking-normal opacity-70">Winner</span>}
            </th>
            <th className="px-2 py-2 text-center">K</th>
            <th className="px-2 py-2 text-center">D</th>
            <th className="px-2 py-2 text-center">A</th>
            <th className="px-2 py-2 text-right">Net Worth</th>
            <th className="hidden px-2 py-2 text-right sm:table-cell">Last Hits</th>
            <th className="hidden px-2 py-2 text-right sm:table-cell">Denies</th>
            <th className="px-2 py-2 text-center">Lvl</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, idx) => {
            const hero = heroMap.get(player.hero_id);
            const playerName = playerNameMap.get(player.account_id) ?? `Player ${player.account_id}`;
            const isTopKiller = player.kills === maxKills && maxKills > 0;

            return (
              <tr
                key={player.account_id}
                className={cn(
                  "border-b border-border-subtle transition-colors hover:border-l-2 hover:border-l-soul hover:bg-surface",
                  idx % 2 === 1 && "bg-surface-elevated/30",
                  !isWinner && "opacity-90",
                )}
              >
                <td className="px-3 py-2 sm:px-4">
                  <div className="flex items-center gap-2">
                    {hero?.images?.icon_image_small_webp ? (
                      <Link href={`/heroes/${hero.id}`}>
                        <Image
                          src={hero.images.icon_image_small_webp}
                          alt={hero.name}
                          width={24}
                          height={24}
                          className="rounded flex-shrink-0"
                        />
                      </Link>
                    ) : (
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-surface-elevated text-[10px] text-text-muted">
                        ?
                      </div>
                    )}
                    <Link
                      href={`/player/${player.account_id}`}
                      className="truncate text-text-primary hover:text-soul transition-colors"
                    >
                      {playerName}
                    </Link>
                  </div>
                </td>
                <td className={cn(
                  "px-2 py-2 text-center font-mono",
                  isTopKiller ? "text-soul font-semibold" : "text-soul",
                )}>
                  {player.kills}
                </td>
                <td className="px-2 py-2 text-center font-mono text-blood">{player.deaths}</td>
                <td className="px-2 py-2 text-center font-mono text-sigil">{player.assists}</td>
                <td className="px-2 py-2 text-right font-mono text-amber">{formatNumber(player.net_worth)}</td>
                <td className="hidden px-2 py-2 text-right font-mono text-text-secondary sm:table-cell">{player.last_hits}</td>
                <td className="hidden px-2 py-2 text-right font-mono text-text-secondary sm:table-cell">{player.denies}</td>
                <td className="px-2 py-2 text-center font-mono text-text-secondary">{player.player_level ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
