export const revalidate = 604800; // ISR: cache heroes grid for 7 days (hero data changes only on game patches)

import { Suspense } from "react";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SigilBackground } from "@/components/layout/SigilBackground";
import HeroesContent from "@/components/hero/HeroesContent";
import { SigilLoader } from "@/components/ui/SigilLoader";
import { parseAnalyticsTimeRange } from "@/lib/analyticsTimeRange";

export const metadata: Metadata = {
  title: "All Deadlock Heroes — Win Rates & Pick Rates",
  description:
    "Browse all Deadlock heroes with global win rates, pick rates, and stats by rank. Filter and sort to find the strongest heroes in the current meta.",
  alternates: {
    canonical: "/heroes",
  },
  openGraph: {
    title: "All Deadlock Heroes — Win Rates & Pick Rates",
    description:
      "Browse all Deadlock heroes with global win rates, pick rates, and stats by rank.",
    url: "/heroes",
  },
};

interface HeroesPageProps {
  searchParams?: Promise<{ time?: string }>;
}

export default async function HeroesPage({ searchParams }: HeroesPageProps) {
  const params = await searchParams;
  const timeRange = parseAnalyticsTimeRange(params?.time);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="relative flex-1 atmosphere-soul">
        <SigilBackground intensity="subtle" />

        <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Suspense fallback={<SigilLoader />}>
            <HeroesContent timeRange={timeRange} />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
