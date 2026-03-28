import type { Metadata } from "next";
import { Cinzel, Cinzel_Decorative, Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const cinzelDecorative = Cinzel_Decorative({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

const cinzel = Cinzel({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dltracker.app"),
  title: {
    default: "dltracker — Deadlock Stats Tracker | Hero Win Rates, Match History & Leaderboards",
    template: "%s | dltracker",
  },
  description:
    "Track your Deadlock stats, hero win rates, match history, and ranked leaderboards. Free stats tracker for Valve's Deadlock — search any player, browse all heroes, and view global rankings.",
  keywords: [
    "deadlock tracker",
    "deadlock stats",
    "dltracker",
    "deadlock hero win rates",
    "deadlock match history",
    "deadlock leaderboard",
    "deadlock player stats",
    "valve deadlock",
    "deadlock ranked",
  ],
  openGraph: {
    title: "dltracker | Deadlock Stats Tracker",
    description:
      "Track Deadlock hero win rates, player stats, match history, and ranked leaderboards. Free and open.",
    siteName: "dltracker",
    type: "website",
    locale: "en_US",
    url: "https://dltracker.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "dltracker | Deadlock Stats Tracker",
    description:
      "Track Deadlock hero win rates, player stats, match history, and ranked leaderboards.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body
        className={`${cinzelDecorative.variable} ${cinzel.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "dltracker",
              url: "https://dltracker.app",
              description:
                "Free Deadlock stats tracker. Search players, browse hero win rates, view match history, and check ranked leaderboards.",
              applicationCategory: "GameApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
            }),
          }}
        />
        {children}
        <Analytics />
        {/* Vignette overlay — deeper edges + warm amber candlelight from above */}
        <div
          className="pointer-events-none fixed inset-0 z-50"
          style={{
            background: [
              "radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(8, 11, 16, 0.6) 100%)",
              "radial-gradient(ellipse at 50% 0%, rgba(212, 168, 83, 0.03) 0%, transparent 60%)",
            ].join(", "),
            willChange: "auto",
            contain: "strict",
            transform: "translateZ(0)",
          }}
          aria-hidden="true"
        />
      </body>
    </html>
  );
}
