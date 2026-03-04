import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { GlowCard } from "@/components/motion";

export interface HeroWithStats {
  id: number;
  name: string;
  role: string | undefined;
  imageUrl: string | undefined;
  winRate: number;
  pickRate: number;
  matches: number;
}

interface HeroCardProps {
  hero: HeroWithStats;
}

export function HeroCard({ hero }: HeroCardProps) {
  return (
    <Link href={`/heroes/${hero.id}`} className="block">
      <GlowCard>
        <div className="p-4">
          <div className="flex items-center gap-3">
            {hero.imageUrl ? (
              <div className="overflow-hidden rounded">
                <Image
                  src={hero.imageUrl}
                  alt={hero.name}
                  width={48}
                  height={48}
                  className="rounded transition-transform duration-300 hover:scale-110"
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded bg-surface-elevated text-text-muted">
                ?
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-heading text-sm text-text-primary">
                {hero.name}
              </p>
              {hero.role && (
                <p className="text-xs text-text-secondary">{hero.role}</p>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs">
            <span
              className={cn(
                "font-mono",
                hero.winRate >= 50 ? "text-soul" : "text-blood",
              )}
            >
              {hero.winRate.toFixed(1)}% WR
            </span>
            <span className="font-mono text-text-secondary">
              {hero.matches.toLocaleString()} matches
            </span>
            <span className="font-mono text-text-secondary">
              {hero.pickRate.toFixed(1)}% pick
            </span>
          </div>

          {/* Win rate bar */}
          <div className="mt-2 h-1 w-full rounded-full bg-blood/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-soul"
              style={{ width: `${hero.winRate}%` }}
            />
          </div>
        </div>
      </GlowCard>
    </Link>
  );
}
