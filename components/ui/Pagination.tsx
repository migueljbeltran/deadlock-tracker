"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const hasPrev = currentPage > 1;

  if (!hasPrev && !hasNextPage) return null;

  return (
    <div className="flex items-center justify-center gap-4 pt-6">
      {hasPrev ? (
        <Link
          href={buildUrl(baseUrl, currentPage - 1, extraParams)}
          className={linkStyles}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Link>
      ) : (
        <span className={disabledStyles} aria-disabled="true">
          <ChevronLeft className="h-4 w-4" />
          Previous
        </span>
      )}

      <span className="font-mono text-sm text-soul bg-[rgba(22,27,34,0.92)] border border-border-subtle rounded-full px-3 py-1">
        Page {currentPage}
      </span>

      {hasNextPage ? (
        <Link
          href={buildUrl(baseUrl, currentPage + 1, extraParams)}
          className={linkStyles}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className={disabledStyles} aria-disabled="true">
          Next
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </div>
  );
}
