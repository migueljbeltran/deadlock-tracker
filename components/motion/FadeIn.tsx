"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

interface FadeInProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
  /** When true (default), animates when scrolled into view. When false, animates immediately on mount. */
  triggerOnScroll?: boolean;
}

// Larger offsets for immediate (page-load) animations where there's no scroll conflict
const mountOffsets: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 24 },
  down: { x: 0, y: -24 },
  left: { x: 24, y: 0 },
  right: { x: -24, y: 0 },
  none: { x: 0, y: 0 },
};

// Subtle offsets for scroll-triggered animations to avoid fighting scroll direction
const scrollOffsets: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 8 },
  down: { x: 0, y: -8 },
  left: { x: 12, y: 0 },
  right: { x: -12, y: 0 },
  none: { x: 0, y: 0 },
};

export function FadeIn({
  children,
  direction = "up",
  delay = 0,
  duration = 0.5,
  className,
  triggerOnScroll = true,
}: FadeInProps) {
  const offset = triggerOnScroll ? scrollOffsets[direction] : mountOffsets[direction];
  const target = { opacity: 1, x: 0, y: 0 };
  const transition = {
    duration: triggerOnScroll ? 0.4 : duration,
    delay: triggerOnScroll ? Math.min(delay, 0.15) : delay,
    ease: [0.25, 0.46, 0.45, 0.94] as const,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: offset.x, y: offset.y }}
      {...(triggerOnScroll
        ? { whileInView: target, viewport: { once: true, margin: "-40px" } }
        : { animate: target })}
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}
