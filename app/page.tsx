export const revalidate = 300; // ISR: cache homepage for 5 minutes

import type { Metadata } from "next";
import Link from "next/link";
import { Crosshair, BarChart3, Trophy, ArrowRight, Github, Twitch, Heart } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SigilBackground } from "@/components/layout/SigilBackground";
import { ArtDecoDivider } from "@/components/layout/ArtDecoDivider";
import { Button } from "@/components/ui/Button";
import { HeroSearchSection } from "@/components/search/HeroSearchSection";
import { FadeIn, ScrollReveal, GlowCard, CountUp, StaggerList, StaggerItem } from "@/components/motion";
import { getHeroes, getApiInfo } from "@/lib/api";

export const metadata: Metadata = {
  title: {
    absolute:
      "dltracker — Deadlock Stats Tracker | Hero Win Rates, Match History & Leaderboards",
  },
  description:
    "The free Deadlock stats tracker. Search any player, browse hero win rates and pick rates, view match details, and check ranked leaderboards for Valve's Deadlock.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "dltracker — Deadlock Stats Tracker",
    description:
      "Search players, browse hero win rates, view match history, and check ranked leaderboards for Valve's Deadlock.",
    url: "/",
  },
};

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

        {/* ===== HERO SECTION ===== */}
        <section className="relative flex flex-col items-center justify-center px-4 pt-24 pb-16 sm:pt-32 sm:pb-20 lg:pt-40 lg:pb-24">
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
            {/* Title with glow */}
            <FadeIn direction="none" duration={0.8} triggerOnScroll={false}>
              <div className="relative">
                <span
                  className="pointer-events-none absolute inset-0 font-display text-6xl sm:text-7xl lg:text-8xl tracking-wide text-amber blur-lg opacity-40"
                  aria-hidden="true"
                >
                  dltracker
                </span>
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

            {/* Tagline */}
            <FadeIn delay={0.3} triggerOnScroll={false}>
              <p className="mt-4 max-w-lg text-lg sm:text-xl text-text-secondary leading-relaxed">
                Track every soul, every match, every victory in the Cursed Apple
              </p>
            </FadeIn>

            <FadeIn delay={0.5} triggerOnScroll={false}>
              <ArtDecoDivider className="my-8 w-full max-w-sm" />
            </FadeIn>

            {/* Search — the primary action */}
            <FadeIn delay={0.7} triggerOnScroll={false}>
              <HeroSearchSection />
            </FadeIn>

            {/* Trust bar — inline stats below search */}
            <FadeIn delay={0.9} triggerOnScroll={false}>
              <div className="mt-8 flex items-center gap-6 sm:gap-10">
                {[
                  { value: totalPlayers || null, label: "Players" },
                  { value: totalMatches || null, label: "Matches" },
                  { value: playableCount > 0 ? playableCount : null, label: "Heroes" },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col items-center">
                    <span className="font-mono text-2xl sm:text-3xl text-text-primary tabular-nums">
                      {stat.value != null ? (
                        <CountUp value={stat.value} />
                      ) : (
                        "—"
                      )}
                    </span>
                    <span className="text-xs tracking-[0.2em] uppercase text-text-muted mt-1">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ===== FEATURE SHOWCASE ===== */}
        <section className="section-fade-border relative py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="text-center mb-14">
                <h2 className="font-heading text-3xl sm:text-4xl text-text-primary tracking-wide">
                  Uncover the Data Behind Every Match
                </h2>
                <p className="mt-3 text-text-secondary max-w-xl mx-auto">
                  Everything you need to analyze your gameplay, study hero matchups, and climb the ranks.
                </p>
              </div>
            </ScrollReveal>

            <StaggerList className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-3">
              {/* Feature 1: Heroes */}
              <StaggerItem>
                <Link href="/heroes" className="block h-full group">
                  <GlowCard className="p-6 sm:p-8 h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-soul/10 border border-soul/20 group-hover:bg-soul/20 transition-colors">
                        <Crosshair className="h-5 w-5 text-soul" />
                      </div>
                      <h3 className="font-heading text-lg text-text-primary tracking-wide">
                        Hero Analytics
                      </h3>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed flex-1">
                      Browse all {playableCount > 0 ? playableCount : ""} heroes with real-time win rates, pick rates, and tier rankings. Filter by role, sort by performance, and find your next main.
                    </p>
                    <div className="mt-5 flex items-center gap-1.5 text-sm font-medium text-soul opacity-0 translate-x-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                      Browse Heroes <ArrowRight className="h-4 w-4" />
                    </div>
                  </GlowCard>
                </Link>
              </StaggerItem>

              {/* Feature 2: Match History */}
              <StaggerItem>
                <Link href="/" className="block h-full group">
                  <GlowCard className="p-6 sm:p-8 h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber/10 border border-amber/20 group-hover:bg-amber/20 transition-colors">
                        <BarChart3 className="h-5 w-5 text-amber" />
                      </div>
                      <h3 className="font-heading text-lg text-text-primary tracking-wide">
                        Match Investigation
                      </h3>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed flex-1">
                      Dive into detailed match breakdowns with full team scoreboards, K/D/A stats, item builds, and performance metrics for every player.
                    </p>
                    <div className="mt-5 flex items-center gap-1.5 text-sm font-medium text-amber opacity-0 translate-x-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                      Search a Player <ArrowRight className="h-4 w-4" />
                    </div>
                  </GlowCard>
                </Link>
              </StaggerItem>

              {/* Feature 3: Leaderboard */}
              <StaggerItem>
                <Link href="/leaderboard" className="block h-full group">
                  <GlowCard className="p-6 sm:p-8 h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sigil/10 border border-sigil/20 group-hover:bg-sigil/20 transition-colors">
                        <Trophy className="h-5 w-5 text-sigil" />
                      </div>
                      <h3 className="font-heading text-lg text-text-primary tracking-wide">
                        Ranked Leaderboards
                      </h3>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed flex-1">
                      See who dominates each region. View top players with rank badges, win streaks, and most-played heroes across all competitive tiers.
                    </p>
                    <div className="mt-5 flex items-center gap-1.5 text-sm font-medium text-sigil opacity-0 translate-x-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                      View Leaderboard <ArrowRight className="h-4 w-4" />
                    </div>
                  </GlowCard>
                </Link>
              </StaggerItem>
            </StaggerList>
          </div>
        </section>

        {/* ===== COMMUNITY / SUPPORT ===== */}
        <section className="section-fade-border relative py-20 sm:py-24">
          <div className="pointer-events-none absolute inset-0 atmosphere-amber" aria-hidden="true" />

          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="text-center mb-10">
                <ArtDecoDivider variant="ornate" className="mb-10" />
                <h2 className="font-heading text-2xl sm:text-3xl text-amber mb-3">
                  Built for the Community
                </h2>
                <p className="max-w-md mx-auto text-text-secondary">
                  Free, open-source, and made for Deadlock players. Follow the stream, contribute on GitHub, or help keep the lights on.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <a
                  href="https://twitch.tv/trazenmb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <GlowCard className="p-6 text-center h-full">
                    <Twitch className="h-6 w-6 mx-auto mb-3 text-text-muted group-hover:text-[#9146FF] transition-colors" />
                    <h3 className="font-heading text-sm tracking-wide text-text-primary mb-1">
                      Watch the Stream
                    </h3>
                    <p className="text-xs text-text-muted">
                      Catch live Deadlock gameplay
                    </p>
                  </GlowCard>
                </a>

                <a
                  href="https://ko-fi.com/trazen"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <GlowCard className="p-6 text-center h-full">
                    <Heart className="h-6 w-6 mx-auto mb-3 text-text-muted group-hover:text-[#FF5E5B] transition-colors" />
                    <h3 className="font-heading text-sm tracking-wide text-text-primary mb-1">
                      Support the Project
                    </h3>
                    <p className="text-xs text-text-muted">
                      Help keep dltracker running
                    </p>
                  </GlowCard>
                </a>

                <a
                  href="https://github.com/migueljbeltran/deadlock-tracker"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <GlowCard className="p-6 text-center h-full">
                    <Github className="h-6 w-6 mx-auto mb-3 text-text-muted group-hover:text-text-primary transition-colors" />
                    <h3 className="font-heading text-sm tracking-wide text-text-primary mb-1">
                      View Source
                    </h3>
                    <p className="text-xs text-text-muted">
                      Contribute or report issues
                    </p>
                  </GlowCard>
                </a>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.15}>
              <p className="text-xs text-text-muted mt-6 text-center">Free. No sign-up required.</p>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
