import Link from "next/link";
import { Users, Swords, Shield } from "lucide-react";
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
        <section className="relative flex flex-col items-center justify-center px-4 py-32 sm:py-40">
          {/* Multi-layer gradient mesh */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: [
                "radial-gradient(ellipse at 20% 30%, rgba(61,220,132,0.08) 0%, transparent 50%)",
                "radial-gradient(ellipse at 80% 20%, rgba(212,168,83,0.06) 0%, transparent 40%)",
                "radial-gradient(ellipse at 60% 70%, rgba(26,188,156,0.05) 0%, transparent 50%)",
              ].join(", ")
            }}
            aria-hidden="true"
          />

          {/* Floating ember particles */}
          {[
            { left: "15%", top: "20%", delay: "0s", duration: "4s", size: "3px" },
            { left: "80%", top: "30%", delay: "1.2s", duration: "5s", size: "2px" },
            { left: "25%", top: "70%", delay: "0.5s", duration: "3.5s", size: "2px" },
            { left: "65%", top: "15%", delay: "2s", duration: "4.5s", size: "3px" },
            { left: "45%", top: "80%", delay: "0.8s", duration: "3s", size: "2px" },
            { left: "90%", top: "60%", delay: "1.5s", duration: "5s", size: "2px" },
          ].map((ember, i) => (
            <div
              key={i}
              className="pointer-events-none absolute rounded-full bg-amber opacity-40 animate-float"
              style={{
                left: ember.left,
                top: ember.top,
                width: ember.size,
                height: ember.size,
                animationDelay: ember.delay,
                animationDuration: ember.duration,
              }}
              aria-hidden="true"
            />
          ))}

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Title — Option A: Gradient text */}
            <FadeIn direction="none" duration={0.8} triggerOnScroll={false}>
              <div className="relative">
                {/* Glow layer behind */}
                <span
                  className="pointer-events-none absolute inset-0 font-display text-6xl sm:text-7xl lg:text-8xl tracking-wide text-amber blur-lg opacity-40"
                  aria-hidden="true"
                >
                  dltracker
                </span>
                {/* Secondary soul-green glow layer */}
                <span
                  className="pointer-events-none absolute inset-0 font-display text-6xl sm:text-7xl lg:text-8xl tracking-wide text-soul blur-2xl opacity-20"
                  aria-hidden="true"
                >
                  dltracker
                </span>
                <h1 className="font-display text-6xl sm:text-7xl lg:text-8xl tracking-wide bg-clip-text text-transparent bg-gradient-to-b from-amber-light via-amber to-amber/70">
                  dltracker
                </h1>
              </div>
            </FadeIn>

            {/* === TITLE OPTION B: Flat amber + dramatic textShadow === */}
            {/* <FadeIn direction="none" duration={0.8}>
              <h1
                className="font-display text-6xl sm:text-7xl lg:text-8xl text-amber tracking-wide"
                style={{ textShadow: "0 0 40px rgba(212,168,83,0.4), 0 0 80px rgba(212,168,83,0.15), 0 2px 4px rgba(0,0,0,0.5)" }}
              >
                dltracker
              </h1>
            </FadeIn> */}

            {/* Tagline */}
            <FadeIn delay={0.3} triggerOnScroll={false}>
              <p className="mt-4 max-w-md text-lg text-text-secondary">
                A living record of souls and matches from the Cursed Apple
              </p>
            </FadeIn>

            <FadeIn delay={0.5} triggerOnScroll={false}>
              <ArtDecoDivider className="my-8 w-full max-w-sm" />
            </FadeIn>

            {/* Search */}
            <FadeIn delay={0.7} triggerOnScroll={false}>
              <HeroSearchSection />
            </FadeIn>
          </div>
        </section>

        {/* Quick Stats Preview */}
        <section className="section-fade-border relative py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="glass-panel rounded-xl p-8 atmosphere-soul">
            <ScrollReveal>
              <h2 className="font-heading text-3xl text-center text-text-primary tracking-wide mb-8">
                The Archives Await
              </h2>
            </ScrollReveal>

            <ScrollReveal delay={0.15}>
              <StaggerList className="grid grid-cols-1 gap-6 sm:grid-cols-4">
                {/* Stat cards */}
                {[
                  { label: "Souls Catalogued", value: totalPlayers || null, Icon: Users, span: "sm:col-span-1" },
                  { label: "Matches Recorded", value: totalMatches || null, Icon: Swords, span: "sm:col-span-2" },
                  { label: "Heroes Documented", value: playableCount > 0 ? playableCount : null, Icon: Shield, span: "sm:col-span-1" },
                ].map((stat) => (
                  <StaggerItem key={stat.label} className={stat.span}>
                    <GlowCard className="p-8">
                      <div className="flex flex-col items-center text-center">
                        <stat.Icon className="h-8 w-8 text-sigil mb-3 drop-shadow-[0_0_8px_rgba(26,188,156,0.4)]" />
                        <span
                          className="font-mono text-5xl bg-gradient-to-b from-text-primary to-text-secondary bg-clip-text text-transparent"
                        >
                          {stat.value != null ? (
                            <CountUp value={stat.value} />
                          ) : (
                            "—"
                          )}
                        </span>
                        {/* Accent bar */}
                        <div className="mt-2 h-0.5 w-10 rounded-full bg-gradient-to-r from-soul/60 to-soul/0" />
                        <span className="mt-2 text-sm tracking-wide uppercase font-heading text-text-secondary">{stat.label}</span>
                      </div>
                    </GlowCard>
                  </StaggerItem>
                ))}
              </StaggerList>
            </ScrollReveal>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <ScrollReveal>
          <section className="relative py-24">
            <ArtDecoDivider variant="ornate" className="mb-8" />

            {/* Ambient glow behind CTAs */}
            <div className="pointer-events-none absolute inset-0 atmosphere-amber" aria-hidden="true" />

            <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
              <h2 className="font-heading text-2xl sm:text-3xl text-amber mb-4">
                Begin Your Investigation
              </h2>
              <p className="max-w-lg mx-auto text-text-secondary mb-6">
                Explore hero statistics, track your performance, and uncover the secrets of the Cursed Apple.
              </p>
              <div className="flex justify-center gap-6">
                <Link href="/heroes" className="animated-border rounded-md">
                  <Button variant="primary" size="lg">
                    Browse Heroes
                  </Button>
                </Link>
                <Link href="/leaderboard">
                  <Button variant="secondary" size="lg">
                    View Leaderboard
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-text-muted mt-3">Free. No sign-up required.</p>
            </div>
          </section>
        </ScrollReveal>
      </main>

      <Footer />
    </div>
  );
}
