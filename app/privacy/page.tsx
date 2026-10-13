import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SigilBackground } from "@/components/layout/SigilBackground";
import { ArtDecoDivider } from "@/components/layout/ArtDecoDivider";
import { FadeIn } from "@/components/motion";
import { SITE_CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy | dltracker",
  description: "Privacy policy for dltracker — how your data is handled.",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main id="main-content" className="relative flex-1">
        <SigilBackground intensity="subtle" />

        <div className="atmosphere-amber relative z-10 mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <FadeIn>
            <h1 className="font-display text-4xl text-amber tracking-wide text-center" style={{ textShadow: "0 0 20px rgba(212,168,83,0.3)" }}>
              Privacy Policy
            </h1>
            <p className="mt-2 text-center text-text-secondary">
              How dltracker handles your data · Updated October 13, 2026
            </p>
          </FadeIn>

          <ArtDecoDivider className="my-10" />

          <FadeIn delay={0.2}>
            <div className="space-y-8">
              <section className="glass-panel rounded-lg p-6">
                <h2 className="font-heading text-xl text-text-primary mb-3">Who Operates This Site</h2>
                <p className="text-text-secondary leading-relaxed">
                  dltracker is an independent community project maintained by Miguel
                  Beltran, currently operating from the Philippines. This policy covers
                  dltracker.app, not the independent services linked from the site.
                  For privacy questions or requests, email{" "}
                  <a href={`mailto:${SITE_CONTACT_EMAIL}`} className="text-soul underline">{SITE_CONTACT_EMAIL}</a>.
                </p>
              </section>
              <section className="glass-panel rounded-lg p-6">
                <h2 className="font-heading text-xl text-text-primary mb-3">No Accounts Required</h2>
                <p className="text-text-secondary leading-relaxed">
                  dltracker does not require you to create an account or sign in.
                  There is no user registration or password collection. This does not
                  mean the site processes no personal data: public player identifiers,
                  profiles, IP addresses, searches, and technical diagnostics may be
                  processed as described below.
                </p>
              </section>

              <section className="glass-panel rounded-lg p-6">
                <h2 className="font-heading text-xl text-text-primary mb-3">Local Search History</h2>
                <p className="text-text-secondary leading-relaxed">
                  Your recent searches are stored in your browser&apos;s local storage
                  so they can be shown on the home page. Up to five player selections,
                  including account IDs, display names, and avatar URLs, remain on that
                  device until you clear them. Use the Clear recent searches button or
                  clear this site&apos;s browser storage. The recent-search list is not
                  uploaded as a list, but individual searches are sent to the server to
                  perform lookups and may appear in caches or operational logs.
                </p>
              </section>

              <section className="glass-panel rounded-lg p-6">
                <h2 className="font-heading text-xl text-text-primary mb-3">Analytics and Error Monitoring</h2>
                <p className="text-text-secondary leading-relaxed">
                  dltracker uses Vercel Analytics to understand aggregate page
                  usage and Sentry to diagnose errors. These services may receive
                  technical details such as page URLs, device/browser information,
                  timestamps, and error stack traces. The application removes
                  authorization and cookie headers from configured Sentry error events.
                  Session replay is disabled. Vercel describes its Web Analytics as
                  aggregate measurement without third-party cookies; this does not
                  mean all hosting or operational data is anonymous.
                </p>
                <p className="mt-3 text-text-secondary leading-relaxed">
                  See <a href="https://vercel.com/docs/analytics/privacy-policy" className="text-soul underline">Vercel&apos;s analytics disclosure</a>
                  {" "}and <a href="https://sentry.io/privacy/" className="text-soul underline">Sentry&apos;s privacy notice</a>.
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
                      hero statistics, leaderboard rankings, and cached public Steam profiles.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber" />
                    <span>
                      <strong className="text-text-primary">Steam Web API</strong> — Public player profiles
                      (display name, avatar, Steam/profile identifiers). No Steam password
                      is requested. The site is independent of Valve and Steam.
                    </span>
                  </li>
                </ul>
              </section>

              <section className="glass-panel rounded-lg p-6">
                <h2 className="font-heading text-xl text-text-primary mb-3">Why Data Is Processed</h2>
                <p className="text-text-secondary leading-relaxed">
                  Player identifiers and public stats are used to show requested profiles,
                  matches, and rankings. Search results and compact snapshots are cached
                  to make the site faster and reduce repeated upstream requests. IP-based
                  counters help limit abuse. Hosting logs and error reports support
                  security and troubleshooting; aggregate analytics help improve the site.
                </p>
              </section>

              <section className="glass-panel rounded-lg p-6">
                <h2 className="font-heading text-xl text-text-primary mb-3">Service Providers and External Sites</h2>
                <p className="text-text-secondary leading-relaxed">
                  Vercel provides hosting and analytics, Upstash Redis stores caches and
                  rate-limit counters, and Sentry receives configured diagnostics. Data
                  may be processed outside your country, including in the United States.
                  Requests to Deadlock and Steam services disclose the lookup identifiers
                  needed for a result. Your browser also contacts external image providers
                  when displaying game assets and Steam avatars, which reveals technical
                  connection details such as your IP address to those providers.
                </p>
                <p className="mt-3 text-text-secondary leading-relaxed">
                  Links to Steam, GitHub, Twitch, and Ko-fi open independent services with
                  their own privacy practices. Optional support payments are handled by
                  Ko-fi and its payment providers; dltracker does not collect card details.
                </p>
              </section>

              <section className="glass-panel rounded-lg p-6">
                <h2 className="font-heading text-xl text-text-primary mb-3">Retention and Your Choices</h2>
                <p className="text-text-secondary leading-relaxed">
                  Redis cache entries generally expire within minutes to seven days,
                  depending on the dataset, and may be refreshed or repopulated from
                  public APIs. Next&apos;s persistent caches can retain data longer;
                  some lookups, such as Steam vanity-name resolution, are cached for
                  up to a year. Rate-limit counters and
                  refresh locks are short-lived. Browser search history remains until
                  cleared. Hosting logs, analytics, diagnostics, and backups follow the
                  relevant providers&apos; configured retention settings; a cache expiration
                  is not a promise that every provider record has been deleted.
                </p>
                <p className="mt-3 text-text-secondary leading-relaxed">
                  Depending on applicable law, you may have rights to information, access,
                  correction, objection, or deletion. You can request review of public
                  profile data shown here. Changes to upstream records may also need to be
                  requested from Steam or the community API; deleting a local cache does
                  not delete the source record. You may also contact your local privacy
                  regulator, including the <a href="https://privacy.gov.ph/" className="text-soul underline">Philippine National Privacy Commission</a>.
                </p>
              </section>

              <section className="glass-panel rounded-lg p-6">
                <h2 className="font-heading text-xl text-text-primary mb-3">Privacy Requests and Policy Updates</h2>
                <p className="text-text-secondary leading-relaxed">
                  For a private request, email{" "}
                  <a href={`mailto:${SITE_CONTACT_EMAIL}`} className="text-soul underline">{SITE_CONTACT_EMAIL}</a>
                  {" "}with the affected profile URL and the request. We may need to verify
                  that a request concerns your data; do not send passwords or identity
                  documents unless a safe and necessary verification method is agreed.
                  General bug reports can be made through the{" "}
                  <a
                    href="https://github.com/migueljbeltran/deadlock-tracker"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-soul hover:text-soul/80 transition-colors"
                  >
                    GitHub repository
                  </a>.
                  {" "}Issues are public, so keep private information and credentials out
                  of them. This notice may be updated as the site or its providers change;
                  the date above identifies the latest revision.
                </p>
              </section>
            </div>
          </FadeIn>

          <div className="mt-10 text-center">
            <Link prefetch={false} href="/" className="text-sm text-text-secondary hover:text-soul transition-colors">
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
