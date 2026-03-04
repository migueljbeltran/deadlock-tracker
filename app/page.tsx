import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SigilBackground } from "@/components/layout/SigilBackground";
import { ArtDecoDivider } from "@/components/layout/ArtDecoDivider";
import { Button } from "@/components/ui/Button";
import { HeroSearchSection } from "@/components/search/HeroSearchSection";
import { FadeIn, ScrollReveal, GlowCard, CountUp, StaggerList, StaggerItem } from "@/components/motion";
import { getHeroes, getApiInfo } from "@/lib/api";

export default async function Home() {
  const [heroes, apiInfo] = await Promise.all([
    getHeroes().catch(() => []),
    getApiInfo().catch(() => null),
  ]);

  const playableCount = heroes.filter(
    (h) => h.player_selectable !== false && !h.disabled && !h.in_development,
  ).length;

  const totalMatches = apiInfo?.table_sizes?.match_info?.rows ?? 0;
  const totalPlayers = apiInfo?.table_sizes?.steam_profiles?.rows ?? 0;
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="relative flex-1">
        <SigilBackground intensity="subtle" />

        {/* Hero Section — cascading curtain-rise reveal */}
        <section className="relative flex flex-col items-center justify-center px-4 py-24 sm:py-32">
          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Title */}
            <FadeIn direction="none" duration={0.8}>
              <h1
                className="font-display text-4xl sm:text-5xl lg:text-6xl text-amber tracking-wide"
                style={{ textShadow: "0 0 30px rgba(212, 168, 83, 0.3), 0 0 60px rgba(212, 168, 83, 0.1)" }}
              >
                dltracker
              </h1>
            </FadeIn>

            {/* Tagline */}
            <FadeIn delay={0.3}>
              <p className="mt-4 max-w-md text-lg text-text-secondary">
                A living record of souls and matches from the Cursed Apple
              </p>
            </FadeIn>

            <FadeIn delay={0.5}>
              <ArtDecoDivider className="my-8 w-full max-w-sm" />
            </FadeIn>

            {/* Search */}
            <FadeIn delay={0.7}>
              <HeroSearchSection />
            </FadeIn>
          </div>
        </section>

        {/* Quick Stats Preview */}
        <section className="relative border-t border-border-subtle bg-surface/50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <h2 className="font-heading text-2xl text-center text-text-primary mb-8">
                The Archives Await
              </h2>
            </ScrollReveal>

            <ScrollReveal delay={0.15}>
              <StaggerList className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {/* Stat cards */}
                {[
                  { label: "Souls Catalogued", value: totalPlayers || null, icon: "⬡" },
                  { label: "Matches Recorded", value: totalMatches || null, icon: "◈" },
                  { label: "Heroes Documented", value: playableCount > 0 ? playableCount : null, icon: "◇" },
                ].map((stat) => (
                  <StaggerItem key={stat.label}>
                    <GlowCard className="p-6">
                      <div className="flex flex-col items-center text-center">
                        <span className="text-2xl text-sigil mb-2">{stat.icon}</span>
                        <span className="font-mono text-3xl text-soul">
                          {stat.value != null ? (
                            <CountUp value={stat.value} />
                          ) : (
                            "—"
                          )}
                        </span>
                        {/* Accent bar */}
                        <div className="mt-2 h-0.5 w-12 rounded-full bg-gradient-to-r from-soul/60 to-soul/0" />
                        <span className="mt-2 text-sm text-text-secondary">{stat.label}</span>
                      </div>
                    </GlowCard>
                  </StaggerItem>
                ))}
              </StaggerList>
            </ScrollReveal>
          </div>
        </section>

        {/* CTA Section */}
        <ScrollReveal>
          <section className="relative py-16">
            <ArtDecoDivider variant="ornate" className="mb-8" />
            <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
              <h2 className="font-heading text-xl text-amber mb-4">
                Begin Your Investigation
              </h2>
              <p className="max-w-lg mx-auto text-text-secondary mb-6">
                Explore hero statistics, track your performance, and uncover the secrets of the Cursed Apple.
              </p>
              <div className="flex justify-center gap-4">
                <Link href="/heroes">
                  <Button variant="primary">
                    Browse Heroes
                  </Button>
                </Link>
                <Link href="/leaderboard">
                  <Button variant="secondary">
                    View Leaderboard
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </ScrollReveal>
      </main>

      <Footer />
    </div>
  );
}
