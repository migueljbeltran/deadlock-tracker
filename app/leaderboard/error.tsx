"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";

export default function LeaderboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Don't report transient upstream API failures to Sentry
    const msg = error?.message ?? "";
    if (msg.includes("Service Unavailable") || msg.includes("Request timeout")) {
      return;
    }
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center atmosphere-blood">
        <div className="glass-panel rounded-xl px-10 py-8 flex flex-col items-center text-center max-w-md">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blood/10 border border-blood/20">
            <AlertTriangle className="h-8 w-8 text-blood" style={{ filter: "drop-shadow(0 0 8px rgba(231,76,60,0.4))" }} />
          </div>
          <h1 className="font-heading text-2xl text-blood" style={{ textShadow: "0 0 20px rgba(231,76,60,0.3)" }}>
            The Archives Faltered
          </h1>
          <p className="mt-3 text-text-secondary">
            An error occurred while retrieving leaderboard data.
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
