export const revalidate = 120; // ISR: cache heroes grid for 2 minutes

import { Suspense } from "react";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SigilBackground } from "@/components/layout/SigilBackground";
import HeroesContent from "@/components/hero/HeroesContent";
import { SigilLoader } from "@/components/ui/SigilLoader";

export const metadata: Metadata = {
  title: "Heroes | dltracker",
  description: "Browse all Deadlock heroes with global win rates and pick rates.",
};

interface HeroesPageProps {
  searchParams: Promise<{ rank?: string }>;
}

export default function HeroesPage({ searchParams }: HeroesPageProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="relative flex-1 atmosphere-soul">
        <SigilBackground intensity="subtle" />

        <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Suspense fallback={<SigilLoader />}>
            <HeroesContent searchParams={searchParams} />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
