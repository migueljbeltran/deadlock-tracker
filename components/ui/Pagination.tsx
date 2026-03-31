"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface PaginationProps {
  currentPage: number;
  hasNextPage: boolean;
  baseUrl: string;
  extraParams?: Record<string, string>;
}

function buildUrl(
  baseUrl: string,
  page: number,
  extraParams?: Record<string, string>,
): string {
  const params = new URLSearchParams();
  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      params.set(key, value);
    }
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  const qs = params.toString();
  return qs ? `${baseUrl}?${qs}` : baseUrl;
}

const linkStyles = cn(
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150",
  "h-8 px-3 text-sm rounded-md",
  "border border-border-subtle bg-[rgba(22,27,34,0.92)] text-text-secondary",
  "hover:border-amber hover:text-amber",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soul focus-visible:ring-offset-2 focus-visible:ring-offset-deep",
);

const disabledStyles = cn(
  "inline-flex items-center justify-center gap-2 font-medium",
  "h-8 px-3 text-sm rounded-md",
  "border border-border-subtle bg-transparent text-text-secondary",
  "opacity-50 pointer-events-none",
);

export function Pagination({
  currentPage,
  hasNextPage,
  baseUrl,
  extraParams,
}: PaginationProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const hasPrev = currentPage > 1;

  if (!hasPrev && !hasNextPage) return null;

  function navigate(page: number) {
    startTransition(() => {
      router.push(buildUrl(baseUrl, page, extraParams));
    });
  }

  return (
    <div className={cn("flex items-center justify-center gap-4 pt-6 transition-opacity", isPending && "opacity-60")}>
      {hasPrev ? (
        <button
          disabled={isPending}
          onClick={() => navigate(currentPage - 1)}
          className={linkStyles}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>
      ) : (
        <span className={disabledStyles} aria-disabled="true">
          <ChevronLeft className="h-4 w-4" />
          Previous
        </span>
      )}

      <span className="font-mono text-sm text-soul bg-[rgba(22,27,34,0.92)] border border-border-subtle rounded-full px-3 py-1 flex items-center gap-2">
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin text-amber" /> : null}
        Page {currentPage}
      </span>

      {hasNextPage ? (
        <button
          disabled={isPending}
          onClick={() => navigate(currentPage + 1)}
          className={linkStyles}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      ) : (
        <span className={disabledStyles} aria-disabled="true">
          Next
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </div>
  );
}
