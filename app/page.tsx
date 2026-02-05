import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SigilBackground } from "@/components/layout/SigilBackground";
import { ArtDecoDivider } from "@/components/layout/ArtDecoDivider";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Search } from "lucide-react";

export default function Home() {
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
            <div className="w-full max-w-md">
              <form className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <Input
                    type="search"
                    placeholder="Seek a soul..."
                    className="pl-10"
                  />
                </div>
                <Button type="submit">
                  Consult
                </Button>
              </form>
              <p className="mt-2 text-sm text-text-muted">
                Search by Steam ID or username
              </p>
            </div>
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
                { label: "Heroes Documented", value: "—", icon: "◇" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center rounded border border-border-subtle bg-surface p-6 text-center transition-all hover:border-soul hover:shadow-[0_0_20px_var(--soul-glow)]"
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
              <Button variant="primary">
                Browse Heroes
              </Button>
              <Button variant="secondary">
                View Leaderboard
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
