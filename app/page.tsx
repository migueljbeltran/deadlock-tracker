import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SigilBackground } from "@/components/layout/SigilBackground";
import { ArtDecoDivider } from "@/components/layout/ArtDecoDivider";
import { Button } from "@/components/ui/Button";
import { HeroSearchSection } from "@/components/search/HeroSearchSection";
import { getHeroes } from "@/lib/api";

export default async function Home() {
  const heroes = await getHeroes().catch(() => []);
  const playableCount = heroes.filter(
    (h) => h.player_selectable !== false && !h.disabled && !h.in_development,
  ).length;
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="relative flex-1">
        <SigilBackground intensity="subtle" />

        {/* Hero Section */}
        <section className="relative flex flex-col items-center justify-center px-4 py-24 sm:py-32">
          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Title */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-amber tracking-wide">
              dltracker
            </h1>

            {/* Tagline */}
            <p className="mt-4 max-w-md text-lg text-text-secondary">
              A living record of souls and matches from the Cursed Apple
            </p>

            <ArtDecoDivider className="my-8 w-full max-w-sm" />

            {/* Search */}
            <HeroSearchSection />
          </div>
        </section>

        {/* Quick Stats Preview */}
        <section className="relative border-t border-border-subtle bg-surface/50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl text-center text-text-primary mb-8">
              The Archives Await
            </h2>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {/* Stat cards */}
              {[
                { label: "Souls Catalogued", value: "—", icon: "⬡" },
                { label: "Matches Recorded", value: "—", icon: "◈" },
                { label: "Heroes Documented", value: playableCount > 0 ? String(playableCount) : "—", icon: "◇" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center rounded border border-border-subtle bg-surface p-6 text-center transition-all hover:border-soul hover:shadow-glow-soul"
                >
                  <span className="text-2xl text-sigil mb-2">{stat.icon}</span>
                  <span className="font-mono text-3xl text-soul">{stat.value}</span>
                  <span className="mt-1 text-sm text-text-secondary">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-16">
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
      </main>

      <Footer />
    </div>
  );
}
