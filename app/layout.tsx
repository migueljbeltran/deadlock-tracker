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
        {/* Vignette overlay */}
        <div
          className="pointer-events-none fixed inset-0 z-50"
          style={{
            background: "radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(8, 11, 16, 0.4) 100%)"
          }}
          aria-hidden="true"
        />
      </body>
    </html>
  );
}
