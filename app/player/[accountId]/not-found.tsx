import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SigilBackground } from "@/components/layout/SigilBackground";
import { Button } from "@/components/ui/Button";

export default function PlayerNotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="relative flex flex-1 items-center justify-center">
        <SigilBackground intensity="subtle" />
        <div className="relative z-10 flex flex-col items-center text-center px-4">
          <span className="text-6xl mb-4">⬡</span>
          <h1 className="font-display text-3xl text-amber tracking-wide">
            Soul Not Found
          </h1>
          <p className="mt-3 max-w-sm text-text-secondary">
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
