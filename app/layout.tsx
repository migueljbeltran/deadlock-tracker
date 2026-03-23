import type { Metadata } from "next";
import { Cinzel, Cinzel_Decorative, Inter, JetBrains_Mono } from "next/font/google";
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
  title: "dltracker | Deadlock Stats Tracker",
  description: "A living record of souls and matches from the Cursed Apple. Track your Deadlock statistics, hero performance, and match history.",
  keywords: ["Deadlock", "stats", "tracker", "Valve", "match history", "heroes", "dltracker"],
  openGraph: {
    title: "dltracker | Deadlock Stats Tracker",
    description: "Track your Deadlock statistics, hero performance, match history, and leaderboards.",
    siteName: "dltracker",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "dltracker | Deadlock Stats Tracker",
    description: "Track your Deadlock statistics, hero performance, match history, and leaderboards.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${cinzelDecorative.variable} ${cinzel.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
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
