import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SigilLoader } from "@/components/ui/SigilLoader";

export default function ItemsLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center atmosphere-amber">
        <div className="glass-panel rounded-xl px-10 py-8 flex flex-col items-center gap-4 shadow-[var(--glow-amber-ambient)]">
          <SigilLoader size="lg" />
          <p className="font-heading text-text-secondary">
            Cataloging the armory...
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
