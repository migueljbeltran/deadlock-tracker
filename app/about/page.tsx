export const revalidate = 86400; // ISR: cache about page for 24 hours

import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Heart } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SigilBackground } from "@/components/layout/SigilBackground";
import { ArtDecoDivider } from "@/components/layout/ArtDecoDivider";
import { FadeIn } from "@/components/motion";

export const metadata: Metadata = {
  title: "About | dltracker",
  description: "About dltracker — a community-built Deadlock stats tracker.",
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="relative flex-1">
        <SigilBackground intensity="subtle" />

        <div className="atmosphere-amber relative z-10 mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <FadeIn>
            <h1 className="font-display text-4xl text-amber tracking-wide text-center" style={{ textShadow: "0 0 20px rgba(212,168,83,0.3)" }}>
              About dltracker
            </h1>
            <p className="mt-2 text-center text-text-secondary">
              A community-built stats tracker for Deadlock
            </p>
          </FadeIn>

          <ArtDecoDivider className="my-10" />

          <FadeIn delay={0.2}>
            <div className="space-y-8">
              <section className="glass-panel rounded-lg p-6">
                <h2 className="font-heading text-xl text-text-primary mb-3">What is dltracker?</h2>
                <p className="text-text-secondary leading-relaxed">
                  dltracker is a free, open-source stats tracker for Valve&apos;s Deadlock.
                  Look up players by Steam ID, explore hero win rates and tier lists,
                  browse item statistics, view match details with full scoreboards,
                  and check regional leaderboards.
                </p>
              </section>

              <section className="glass-panel rounded-lg p-6">
                <h2 className="font-heading text-xl text-text-primary mb-3">Data Sources</h2>
                <ul className="space-y-3 text-text-secondary">
                  <li className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-soul" />
                    <span>
                      <strong className="text-text-primary">Deadlock API</strong> — Hero data, match history,
                      player statistics, item analytics, and leaderboards from the community-maintained
                      Deadlock API.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber" />
                    <span>
                      <strong className="text-text-primary">Steam Web API</strong> — Player identity resolution
                      (vanity URLs, display names, avatars). Requires a Steam API key on the server.
                    </span>
                  </li>
                </ul>
              </section>

              <section className="glass-panel rounded-lg p-6">
                <h2 className="font-heading text-xl text-text-primary mb-3">Open Source</h2>
                <p className="text-text-secondary leading-relaxed">
                  dltracker is open source and built with Next.js, TypeScript, and Tailwind CSS.
                  Contributions, bug reports, and feature requests are welcome.
                </p>
                <a
                  href="https://github.com/migueljbeltran/deadlock-tracker"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-soul hover:text-soul/80 transition-colors text-sm"
                >
                  View on GitHub <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </section>

              <section className="glass-panel rounded-lg p-6">
                <h2 className="font-heading text-xl text-text-primary mb-3">Support</h2>
                <p className="text-text-secondary leading-relaxed">
                  If you find dltracker useful, consider supporting development. Every
                  contribution helps keep the servers running and fuels new features.
                </p>
                <a
                  href="https://ko-fi.com/trazen"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-[#FF5E5B] hover:text-[#FF5E5B]/80 transition-colors text-sm"
                >
                  <Heart className="h-3.5 w-3.5" /> Support on Ko-fi <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </section>

              <section className="glass-panel rounded-lg p-6">
                <h2 className="font-heading text-xl text-text-primary mb-3">Disclaimer</h2>
                <p className="text-text-secondary leading-relaxed">
                  dltracker is a community project and is not affiliated with, endorsed by,
                  or connected to Valve Corporation. Deadlock and all related properties are
                  trademarks of Valve Corporation.
                </p>
              </section>
            </div>
          </FadeIn>

          <div className="mt-10 text-center">
            <Link href="/" className="text-sm text-text-secondary hover:text-soul transition-colors">
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
