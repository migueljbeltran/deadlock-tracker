"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";

export default function MatchDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center text-center px-4">
          <span className="text-5xl mb-4">◈</span>
          <h1 className="font-heading text-2xl text-blood">
            The Match Archives Faltered
          </h1>
          <p className="mt-3 max-w-sm text-text-secondary">
            An error occurred while decrypting this match&apos;s records.
            The connection to the archives may be unstable.
          </p>
          <Button variant="primary" className="mt-6" onClick={reset}>
            Try Again
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
