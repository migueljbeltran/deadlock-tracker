import { BookOpen } from "lucide-react";
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
          <div className="glass-panel rounded-lg p-6 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber/20 to-transparent" aria-hidden="true" />
            <h2 className="font-heading text-lg text-amber mb-2 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Lore
            </h2>
            <p className="text-text-secondary leading-relaxed">
              {description.lore}
            </p>
          </div>
        </ScrollReveal>
      )}
      {description.playstyle && (
        <ScrollReveal delay={0.1}>
          <div className="glass-panel rounded-lg p-6 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber/20 to-transparent" aria-hidden="true" />
            <h2 className="font-heading text-lg text-amber mb-2 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Playstyle
            </h2>
            <p className="text-text-secondary leading-relaxed">
              {description.playstyle}
            </p>
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
