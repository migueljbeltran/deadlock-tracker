import Image from "next/image";
import type { DeadlockHero } from "@/lib/api";

interface HeroDetailHeaderProps {
  hero: DeadlockHero;
}

export function HeroDetailHeader({ hero }: HeroDetailHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
      {hero.images?.selection_image_webp ? (
        <Image
          src={hero.images.selection_image_webp}
          alt={hero.name}
          width={200}
          height={200}
          className="rounded border border-border-subtle"
          priority
        />
      ) : (
        <div className="flex h-[200px] w-[200px] items-center justify-center rounded border border-border-subtle bg-surface-elevated text-4xl text-text-muted">
          ?
        </div>
      )}

      <div className="text-center sm:text-left">
        <h1 className="font-display text-3xl text-amber tracking-wide sm:text-4xl">
          {hero.name}
        </h1>
        {hero.description?.role && (
          <span className="mt-2 inline-block rounded border border-sigil/30 bg-sigil/10 px-3 py-1 text-sm text-sigil">
            {hero.description.role}
          </span>
        )}
      </div>
    </div>
  );
}
