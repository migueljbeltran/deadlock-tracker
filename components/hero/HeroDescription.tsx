import type { DeadlockHeroDescription } from "@/lib/api";
import { ScrollReveal } from "@/components/motion";

interface HeroDescriptionProps {
  description: DeadlockHeroDescription;
}

export function HeroDescription({ description }: HeroDescriptionProps) {
  const hasContent = description.lore || description.playstyle;

  if (!hasContent) return null;

  return (
    <div className="space-y-4">
      {description.lore && (
        <ScrollReveal>
          <div className="border-l-2 border-amber/40 pl-4 bg-amber/[0.02] rounded-r py-3 pr-3">
            <h2 className="font-heading text-lg text-amber mb-2">Lore</h2>
            <p className="text-text-secondary leading-relaxed">
              {description.lore}
            </p>
          </div>
        </ScrollReveal>
      )}
      {description.playstyle && (
        <ScrollReveal delay={0.1}>
          <div className="border-l-2 border-amber/40 pl-4 bg-amber/[0.02] rounded-r py-3 pr-3">
            <h2 className="font-heading text-lg text-amber mb-2">Playstyle</h2>
            <p className="text-text-secondary leading-relaxed">
              {description.playstyle}
            </p>
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
