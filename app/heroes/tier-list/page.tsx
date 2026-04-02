export const revalidate = 604800; // ISR: cache tier list for 7 days (hero data changes only on game patches)

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

export default function TierListPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="relative flex-1 atmosphere-amber">
        <SigilBackground intensity="subtle" />

        <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <Suspense fallback={<SigilLoader />}>
            <TierListContent />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
