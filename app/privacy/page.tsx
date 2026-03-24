export const revalidate = 86400; // ISR: cache privacy page for 24 hours

import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SigilBackground } from "@/components/layout/SigilBackground";
import { ArtDecoDivider } from "@/components/layout/ArtDecoDivider";
import { FadeIn } from "@/components/motion";

export const metadata: Metadata = {
  title: "Privacy | dltracker",
  description: "Privacy policy for dltracker — how your data is handled.",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="relative flex-1">
        <SigilBackground intensity="subtle" />

        <div className="atmosphere-amber relative z-10 mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <FadeIn>
            <h1 className="font-display text-4xl text-amber tracking-wide text-center" style={{ textShadow: "0 0 20px rgba(212,168,83,0.3)" }}>
              Privacy
            </h1>
            <p className="mt-2 text-center text-text-secondary">
              How dltracker handles your data
            </p>
          </FadeIn>

          <ArtDecoDivider className="my-10" />

          <FadeIn delay={0.2}>
            <div className="space-y-8">
              <section className="glass-panel rounded-lg p-6">
                <h2 className="font-heading text-xl text-text-primary mb-3">No Accounts Required</h2>
                <p className="text-text-secondary leading-relaxed">
                  dltracker does not require you to create an account or sign in.
                  There is no user registration, no passwords, and no personal data stored
                  on our servers.
                </p>
              </section>

              <section className="glass-panel rounded-lg p-6">
                <h2 className="font-heading text-xl text-text-primary mb-3">No Cookies or Tracking</h2>
                <p className="text-text-secondary leading-relaxed">
                  dltracker does not use cookies, analytics trackers, or any third-party
                  tracking scripts. Your recent searches are stored in your browser&apos;s
                  local storage and never leave your device.
                </p>
              </section>

              <section className="glass-panel rounded-lg p-6">
                <h2 className="font-heading text-xl text-text-primary mb-3">Public Data Only</h2>
                <p className="text-text-secondary leading-relaxed">
                  All data displayed on dltracker comes from publicly available APIs:
                </p>
                <ul className="mt-3 space-y-2 text-text-secondary">
                  <li className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-soul" />
                    <span>
                      <strong className="text-text-primary">Deadlock API</strong> — Public match data,
                      hero statistics, and leaderboard rankings.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber" />
                    <span>
                      <strong className="text-text-primary">Steam Web API</strong> — Public player profiles
                      (display name, avatar). Only public profile information is accessed.
                    </span>
                  </li>
                </ul>
              </section>

              <section className="glass-panel rounded-lg p-6">
                <h2 className="font-heading text-xl text-text-primary mb-3">Questions?</h2>
                <p className="text-text-secondary leading-relaxed">
                  If you have questions about how dltracker handles data, feel free to
                  open an issue on our{" "}
                  <a
                    href="https://github.com/migueljbeltran/deadlock-tracker"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-soul hover:text-soul/80 transition-colors"
                  >
                    GitHub repository
                  </a>.
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
