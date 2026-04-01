export const revalidate = 604800; // ISR: cache items page for 7 days (item data changes only on game patches)

import { Suspense } from "react";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SigilBackground } from "@/components/layout/SigilBackground";
import ItemsContent from "@/components/item/ItemsContent";
import { SigilLoader } from "@/components/ui/SigilLoader";

export const metadata: Metadata = {
  title: "Items | dltracker",
  description: "Browse all Deadlock shop items with win rates and pick rates.",
};

interface ItemsPageProps {
  searchParams: Promise<{ rank?: string }>;
}

export default function ItemsPage({ searchParams }: ItemsPageProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="relative flex-1 atmosphere-amber">
        <SigilBackground intensity="subtle" />

        <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Suspense fallback={<SigilLoader />}>
            <ItemsContent searchParams={searchParams} />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
