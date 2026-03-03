import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SigilLoader } from "@/components/ui/SigilLoader";

export default function PlayerLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <SigilLoader size="lg" />
          <p className="font-heading text-text-secondary">
            Summoning soul records...
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
