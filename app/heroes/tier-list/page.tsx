export const revalidate = 120; // ISR: cache tier list for 2 minutes

import { Suspense } from "react";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SigilBackground } from "@/components/layout/SigilBackground";
import TierListContent from "@/components/hero/TierListContent";
import { SigilLoader } from "@/components/ui/SigilLoader";

export const metadata: Metadata = {
  title: "Hero Tier List | dltracker",
  description: "Deadlock hero tier list based on global win rate and pick rate.",
};

interface TierListPageProps {
  searchParams: Promise<{ rank?: string }>;
}

export default function TierListPage({ searchParams }: TierListPageProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="relative flex-1 atmosphere-amber">
        <SigilBackground intensity="subtle" />

        <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <Suspense fallback={<SigilLoader />}>
            <TierListContent searchParams={searchParams} />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
