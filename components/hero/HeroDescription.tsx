import type { DeadlockHeroDescription } from "@/lib/api";

interface HeroDescriptionProps {
  description: DeadlockHeroDescription;
}

export function HeroDescription({ description }: HeroDescriptionProps) {
  const hasContent = description.lore || description.playstyle;

  if (!hasContent) return null;

  return (
    <div className="space-y-4">
      {description.lore && (
        <div>
          <h2 className="font-heading text-lg text-amber mb-2">Lore</h2>
          <p className="text-text-secondary leading-relaxed">
            {description.lore}
          </p>
        </div>
      )}
      {description.playstyle && (
        <div>
          <h2 className="font-heading text-lg text-amber mb-2">Playstyle</h2>
          <p className="text-text-secondary leading-relaxed">
            {description.playstyle}
          </p>
        </div>
      )}
    </div>
  );
}
