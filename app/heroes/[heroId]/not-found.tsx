import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SigilBackground } from "@/components/layout/SigilBackground";
import { Button } from "@/components/ui/Button";

export default function HeroNotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="relative flex flex-1 items-center justify-center">
        <SigilBackground intensity="subtle" />
        <div className="relative z-10 flex flex-col items-center text-center px-4">
          <span className="text-6xl mb-4">◇</span>
          <h1 className="font-display text-3xl text-amber tracking-wide">
            Hero Not Found
          </h1>
          <p className="mt-3 max-w-sm text-text-secondary">
            This hero has not been catalogued in the archives.
            The identifier may be incorrect.
          </p>
          <Link href="/heroes" className="mt-6">
            <Button variant="primary">Browse All Heroes</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
