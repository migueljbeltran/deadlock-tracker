"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navLinks: { href: string; label: string; exact?: boolean }[] = [
  { href: "/", label: "Home" },
  { href: "/heroes", label: "Heroes", exact: true },
  { href: "/heroes/tier-list", label: "Tier List" },
  { href: "/items", label: "Items" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string, exact?: boolean) {
    if (href === "/" || exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <header
      className="sticky top-0 z-40 bg-[rgba(8,11,16,0.85)] backdrop-blur-md"
      style={{ boxShadow: "0 1px 0 rgba(61,220,132,0.1), 0 4px 30px rgba(0,0,0,0.3)" }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center">
            <svg
              viewBox="0 0 40 40"
              className="h-full w-full text-amber transition-all duration-[2s] ease-linear group-hover:text-amber-light group-hover:rotate-[360deg] drop-shadow-[0_0_8px_rgba(212,168,83,0.3)]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="20" cy="20" r="18" />
              <circle cx="20" cy="20" r="6" />
              <line x1="20" y1="2" x2="20" y2="14" />
              <line x1="20" y1="26" x2="20" y2="38" />
              <line x1="2" y1="20" x2="14" y2="20" />
              <line x1="26" y1="20" x2="38" y2="20" />
              <line x1="7.3" y1="7.3" x2="15.8" y2="15.8" />
              <line x1="24.2" y1="24.2" x2="32.7" y2="32.7" />
              <line x1="32.7" y1="7.3" x2="24.2" y2="15.8" />
              <line x1="15.8" y1="24.2" x2="7.3" y2="32.7" />
            </svg>
          </div>
          <span className="font-heading text-xl tracking-wider text-text-primary hidden sm:block">
            dltracker
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {navLinks.map((link) => {
            const active = isActive(link.href, link.exact);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-5 py-2 text-sm font-medium tracking-wide transition-colors",
                  active
                    ? "text-soul"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface/30 rounded-md border border-transparent hover:border-border-subtle/30"
                )}
              >
                {link.label}
                {active && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-4 right-4 h-1 bg-soul shadow-[0_2px_10px_rgba(61,220,132,0.5)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex items-center justify-center h-10 w-10 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface/30 transition-colors"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-border-subtle/30 bg-[rgba(8,11,16,0.95)]"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => {
                const active = isActive(link.href, link.exact);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "block px-4 py-2.5 rounded-md text-sm font-medium tracking-wide transition-colors",
                      active
                        ? "text-soul bg-soul/10 border-l-2 border-soul"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface/30"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-soul/30 to-transparent" aria-hidden="true" />
    </header>
  );
}
