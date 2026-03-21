import Link from "next/link";
import { SearchX } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SigilBackground } from "@/components/layout/SigilBackground";
import { Button } from "@/components/ui/Button";

export default function PlayerNotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="relative flex flex-1 items-center justify-center atmosphere-soul">
        <SigilBackground intensity="subtle" />
        <div className="relative z-10 glass-panel rounded-xl px-10 py-8 flex flex-col items-center text-center max-w-md">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber/10 border border-amber/20">
            <SearchX className="h-8 w-8 text-amber" style={{ filter: "drop-shadow(0 0 8px rgba(212,168,83,0.4))" }} />
          </div>
          <h1 className="font-display text-3xl text-amber tracking-wide" style={{ textShadow: "0 0 20px rgba(212,168,83,0.3)" }}>
            Soul Not Found
          </h1>
          <p className="mt-3 text-text-secondary">
            This soul has eluded the archives. The identifier may be incorrect,
            or the player has not yet been catalogued.
          </p>
          <Link href="/" className="mt-6">
            <Button variant="primary">Return to the Archives</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
