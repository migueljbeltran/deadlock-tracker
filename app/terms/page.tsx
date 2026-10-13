import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SITE_CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use | dltracker",
  description: "Use of dltracker, community statistics, and third-party services.",
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main-content" className="relative flex-1">
        <div className="atmosphere-amber mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl text-amber text-center">Terms of Use</h1>
          <p className="mt-2 text-center text-text-secondary">Updated October 13, 2026</p>
          <div className="mt-10 space-y-6">
            <section className="glass-panel rounded-lg p-6">
              <h2 className="font-heading text-xl text-text-primary mb-3">Community Statistics</h2>
              <p className="text-text-secondary leading-relaxed">
                dltracker is a free, independent community tool maintained by Miguel
                Beltran. Statistics depend on third-party data and can be delayed,
                incomplete, or incorrect. Rank badges reflect the latest tracked ranked
                match rather than a live view of the game client; tier lists are
                informational and do not guarantee performance. Features and
                availability may change, especially when upstream services are unavailable.
              </p>
            </section>
            <section className="glass-panel rounded-lg p-6">
              <h2 className="font-heading text-xl text-text-primary mb-3">Responsible Use</h2>
              <p className="text-text-secondary leading-relaxed">
                Respect other players&apos; privacy. Do not use the site for harassment,
                impersonation, or unlawful activity. Do not bypass rate limits, probe for
                private credentials, or send requests intended to disrupt the service.
                Abusive traffic may be restricted. Bulk-data users should consult the
                upstream providers rather than repeatedly scraping these pages.
              </p>
            </section>
            <section className="glass-panel rounded-lg p-6">
              <h2 className="font-heading text-xl text-text-primary mb-3">Third-Party Rights and Services</h2>
              <p className="text-text-secondary leading-relaxed">
                dltracker is not affiliated with or endorsed by Valve. Deadlock, Steam,
                names, trademarks, and game assets belong to their respective rights
                holders. Display here does not grant a license to reuse them. External
                services, including Steam, the Deadlock Community API, GitHub, and Ko-fi,
                have their own terms. Optional support payments are handled by Ko-fi and
                its payment providers and do not purchase guaranteed uptime or features.
              </p>
            </section>
            <section className="glass-panel rounded-lg p-6">
              <h2 className="font-heading text-xl text-text-primary mb-3">Privacy and Contact</h2>
              <p className="text-text-secondary leading-relaxed">
                The <Link prefetch={false} href="/privacy" className="text-soul underline">privacy policy</Link>
                {" "}explains public profile data, browser storage, logs, and service
                providers. For privacy, data accuracy, or rights-holder concerns, contact{" "}
                <a href={`mailto:${SITE_CONTACT_EMAIL}`} className="text-soul underline">{SITE_CONTACT_EMAIL}</a>.
                {" "}These terms do not remove rights or protections that applicable law
                does not permit to be excluded. Updates will be reflected in the date above.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
