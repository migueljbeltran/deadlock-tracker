"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#080b10] text-white">
        <div className="max-w-md text-center px-6">
          <h1 className="text-2xl font-semibold mb-3">Something went wrong</h1>
          <p className="text-gray-400 mb-6">
            An unexpected error occurred. The incident has been reported.
          </p>
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
