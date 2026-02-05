"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/heroes", label: "Heroes" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-void/95 backdrop-blur supports-[backdrop-filter]:bg-void/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          {/* Wheel icon placeholder */}
          <div className="relative flex h-10 w-10 items-center justify-center">
            <svg
              viewBox="0 0 40 40"
              className="h-full w-full text-amber transition-colors group-hover:text-amber-light"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="20" cy="20" r="18" />
              <circle cx="20" cy="20" r="6" />
              {/* Spokes */}
              <line x1="20" y1="2" x2="20" y2="14" />
              <line x1="20" y1="26" x2="20" y2="38" />
              <line x1="2" y1="20" x2="14" y2="20" />
              <line x1="26" y1="20" x2="38" y2="20" />
              {/* Diagonal spokes */}
              <line x1="7.3" y1="7.3" x2="15.8" y2="15.8" />
              <line x1="24.2" y1="24.2" x2="32.7" y2="32.7" />
              <line x1="32.7" y1="7.3" x2="24.2" y2="15.8" />
              <line x1="15.8" y1="24.2" x2="7.3" y2="32.7" />
            </svg>
          </div>
          <span className="font-heading text-lg text-text-primary hidden sm:block">
            dltracker
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "text-soul"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-soul" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
