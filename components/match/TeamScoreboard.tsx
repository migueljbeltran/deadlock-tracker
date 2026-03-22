import Link from "next/link";
import Image from "next/image";
import { Crown, Swords, Heart, Coins, AlertTriangle, Users } from "lucide-react";
import type { DeadlockMatchPlayer, DeadlockHero, DeadlockItem } from "@/lib/api";
import { formatNumber, formatDuration } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface TeamScoreboardProps {
  teamLabel: string;
  players: DeadlockMatchPlayer[];
  heroMap: Map<number, DeadlockHero>;
  playerNameMap: Map<number, string>;
  isWinner: boolean;
  playerItemsMap?: Map<number, number[]>;
  itemMap?: Map<number, DeadlockItem>;
}

const LANE_NAMES: Record<number, string> = {
  1: "Yellow",
  2: "Green",
  3: "Blue",
  4: "Green",
  5: "Yellow",
  6: "Blue",
};

const PARTY_COLORS = [
  "bg-soul",
  "bg-amber",
  "bg-sigil",
  "bg-blood",
];

const SLOT_BORDER: Record<string, string> = {
  weapon: "border-amber/40",
  vitality: "border-soul/40",
  spirit: "border-spirit/40",
};

const SLOT_ORDER = ["weapon", "vitality", "spirit"] as const;

export function TeamScoreboard({
  teamLabel,
  players,
  heroMap,
  playerNameMap,
  isWinner,
  playerItemsMap,
  itemMap,
}: TeamScoreboardProps) {
  // Compute MVP highlights
  const maxKills = Math.max(...players.map((p) => p.kills));
  const maxAssists = Math.max(...players.map((p) => p.assists));
  const maxNetWorth = Math.max(...players.map((p) => p.net_worth));

  // Detect unique party groups (filter out solo players — party value 0 or unique)
  const partyCounts = new Map<number, number>();
  for (const p of players) {
    if (p.party != null && p.party > 0) {
      partyCounts.set(p.party, (partyCounts.get(p.party) ?? 0) + 1);
    }
  }
  // Only show party indicators for groups with 2+ members
  const partyGroups = new Map<number, number>(); // party value → color index
  let colorIdx = 0;
  for (const [partyId, count] of partyCounts) {
    if (count >= 2) {
      partyGroups.set(partyId, colorIdx % PARTY_COLORS.length);
      colorIdx++;
    }
  }

  const hasItems = playerItemsMap && itemMap && playerItemsMap.size > 0;

  return (
    <div className={cn(
      "overflow-x-auto rounded-lg glass-panel",
      isWinner
        ? "border-soul/40 shadow-glow-soul"
        : "",
    )}>
      <table className="w-full text-sm">
        <thead>
          <tr className={cn(
            "border-b-2 text-left uppercase tracking-[0.05em] text-xs",
            isWinner
              ? "border-soul bg-gradient-to-r from-soul/20 via-soul/10 to-transparent text-soul"
              : "border-blood bg-gradient-to-r from-blood/15 via-blood/5 to-transparent text-blood",
          )}>
            <th className="px-3 py-2 sm:px-4">
              {isWinner && <Crown className="mr-1.5 inline-block h-3.5 w-3.5 -translate-y-px" />}
              {teamLabel}
              {isWinner && <span className="ml-2 text-[10px] normal-case tracking-normal opacity-70">Winner</span>}
            </th>
            <th className="hidden px-2 py-2 text-center sm:table-cell">Lane</th>
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
            const isTopAssist = player.assists === maxAssists && maxAssists > 0;
            const isTopNetWorth = player.net_worth === maxNetWorth && maxNetWorth > 0;
            const abandoned = player.abandon_match_time_s != null && player.abandon_match_time_s > 0;
            const partyColorIdx = player.party != null ? partyGroups.get(player.party) : undefined;

            // Get this player's shop items
            const playerItemIds = playerItemsMap?.get(player.account_id) ?? [];
            // Group by slot type (weapon → vitality → spirit), highest tier first, max 12
            const playerItems: DeadlockItem[] = [];
            if (itemMap) {
              const allItems = playerItemIds
                .map((id) => itemMap.get(id))
                .filter((item): item is DeadlockItem => item != null);
              for (const slot of SLOT_ORDER) {
                const slotItems = allItems
                  .filter((item) => item.item_slot_type === slot)
                  .sort((a, b) => (b.item_tier ?? 0) - (a.item_tier ?? 0));
                playerItems.push(...slotItems);
              }
              playerItems.splice(12);
            }

            return (
              <tr
                key={player.account_id}
                className={cn(
                  "border-b border-border-subtle transition-colors hover:border-l-2 hover:border-l-soul hover:bg-[rgba(31,41,55,0.5)]",
                  idx % 2 === 1 && "bg-[rgba(31,41,55,0.3)]",
                  isTopKiller && "bg-soul/[0.05]",
                  !isWinner && "opacity-90",
                  abandoned && "opacity-60",
                )}
              >
                <td className="px-3 py-2 sm:px-4">
                  <div className="flex items-center gap-2">
                    {/* Party indicator */}
                    {partyColorIdx != null && (
                      <div
                        className={cn("h-4 w-1 rounded-full flex-shrink-0", PARTY_COLORS[partyColorIdx])}
                        title={`Party group`}
                      />
                    )}
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
                      className={cn(
                        "truncate text-text-primary hover:text-soul transition-colors",
                        abandoned && "line-through opacity-70",
                      )}
                    >
                      {playerName}
                    </Link>
                    {abandoned && (
                      <span className="flex items-center gap-0.5 text-blood text-[10px] flex-shrink-0" title={`Abandoned at ${formatDuration(player.abandon_match_time_s!)}`}>
                        <AlertTriangle className="h-3 w-3" />
                        <span className="hidden sm:inline">{formatDuration(player.abandon_match_time_s!)}</span>
                      </span>
                    )}
                    {partyColorIdx != null && (
                      <Users className="h-3 w-3 text-text-muted flex-shrink-0 hidden sm:inline-block" />
                    )}
                  </div>
                  {/* Item row below player name */}
                  {hasItems && playerItems.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mt-1.5 ml-8">
                      {playerItems.map((item, i) => {
                        const imgSrc = item.shop_image_webp || item.shop_image || item.image_webp || item.image;
                        return (
                          <div
                            key={`${item.id}-${i}`}
                            className={cn(
                              "rounded border bg-surface/50",
                              SLOT_BORDER[item.item_slot_type ?? ""] ?? "border-border-subtle/50",
                            )}
                            title={`${item.name} (T${item.item_tier})`}
                          >
                            {imgSrc ? (
                              <Image
                                src={imgSrc}
                                alt={item.name}
                                width={22}
                                height={22}
                                className="rounded"
                              />
                            ) : (
                              <div className="h-[22px] w-[22px] rounded bg-surface-elevated flex items-center justify-center text-[8px] text-text-muted">
                                ?
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </td>
                <td className="hidden px-2 py-2 text-center text-xs text-text-muted sm:table-cell">
                  {player.assigned_lane ? LANE_NAMES[player.assigned_lane] ?? player.assigned_lane : "—"}
                </td>
                <td
                  className={cn(
                    "px-2 py-2 text-center font-mono",
                    isTopKiller ? "text-soul font-semibold" : "text-soul",
                  )}
                  style={{ textShadow: "0 0 8px rgba(61,220,132,0.3)" }}
                >
                  {player.kills}
                  {isTopKiller && <Swords className="ml-0.5 inline-block h-3 w-3 text-soul" />}
                </td>
                <td className="px-2 py-2 text-center font-mono text-blood" style={{ textShadow: "0 0 8px rgba(231,76,60,0.3)" }}>{player.deaths}</td>
                <td className="px-2 py-2 text-center font-mono text-sigil" style={{ textShadow: "0 0 8px rgba(26,188,156,0.3)" }}>
                  {player.assists}
                  {isTopAssist && <Heart className="ml-0.5 inline-block h-3 w-3 text-sigil" />}
                </td>
                <td className="px-2 py-2 text-right font-mono text-amber" style={{ textShadow: "0 0 8px rgba(212,168,83,0.3)" }}>
                  {formatNumber(player.net_worth)}
                  {isTopNetWorth && <Coins className="ml-0.5 inline-block h-3 w-3 text-amber" />}
                </td>
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
