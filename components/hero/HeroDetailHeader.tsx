import Image from "next/image";
import type { DeadlockHero } from "@/lib/api";
import { FadeIn } from "@/components/motion";

interface HeroDetailHeaderProps {
  hero: DeadlockHero;
}

export function HeroDetailHeader({ hero }: HeroDetailHeaderProps) {
  return (
    <FadeIn>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        {/* Art Deco picture frame */}
        <div className="relative">
          {/* Corner accents */}
          <div className="absolute -top-1 -left-1 h-4 w-4 border-t-2 border-l-2 border-amber" aria-hidden="true" />
          <div className="absolute -top-1 -right-1 h-4 w-4 border-t-2 border-r-2 border-amber" aria-hidden="true" />
          <div className="absolute -bottom-1 -left-1 h-4 w-4 border-b-2 border-l-2 border-amber" aria-hidden="true" />
          <div className="absolute -bottom-1 -right-1 h-4 w-4 border-b-2 border-r-2 border-amber" aria-hidden="true" />

          {(hero.images?.icon_hero_card_webp || hero.images?.icon_hero_card) ? (
            <div className="relative overflow-hidden rounded">
              <Image
                src={(hero.images.icon_hero_card_webp || hero.images.icon_hero_card)!}
                alt={hero.name}
                width={200}
                height={200}
                className="rounded border border-border-subtle"
                priority
              />
              {/* Gradient overlay — emerging from darkness */}
              <div
                className="absolute inset-x-0 bottom-0 h-1/3"
                style={{ background: "linear-gradient(to top, var(--bg-deep) 0%, transparent 100%)" }}
                aria-hidden="true"
              />
            </div>
          ) : (
            <div className="flex h-[200px] w-[200px] items-center justify-center rounded border border-border-subtle bg-surface-elevated text-4xl text-text-muted">
              ?
            </div>
          )}
        </div>

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
    </FadeIn>
  );
}
