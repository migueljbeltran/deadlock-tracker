"use client";

import { useRef, useState, useEffect, useCallback, type ReactNode, type MouseEvent } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface GlowCardProps {
  children: ReactNode;
  className?: string;
}

export function GlowCard({ children, className }: GlowCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [hovering, setHovering] = useState(false);

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (rafRef.current) return;
    const clientX = e.clientX;
    const clientY = e.clientY;
    rafRef.current = requestAnimationFrame(() => {
      const el = ref.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        setPos({
          x: ((clientX - rect.left) / rect.width) * 100,
          y: ((clientY - rect.top) / rect.height) * 100,
        });
      }
      rafRef.current = 0;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => {
        setHovering(false);
        setPos({ x: 50, y: 50 });
      }}
      whileHover={{ scale: 1.03 }}
      transition={{ scale: { duration: 0.2 } }}
      className={cn(
        "relative rounded-md border border-[rgba(48,54,61,0.6)] bg-[rgba(22,27,34,0.92)] overflow-hidden shadow-[var(--shadow-inner-highlight),var(--shadow-depth-sm)] card-shimmer",
        "transition-[border-color,box-shadow] duration-200 hover:border-soul hover:shadow-[0_0_40px_rgba(61,220,132,0.12)]",
        className
      )}
    >
      {/* Radial glow that follows cursor */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          opacity: hovering ? 1 : 0,
          background: `radial-gradient(circle at ${pos.x}% ${pos.y}%, rgba(61, 220, 132, 0.18) 0%, transparent 70%)`,
        }}
        aria-hidden="true"
      />
      {/* Amber accent glow that follows cursor */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          opacity: hovering ? 1 : 0,
          background: `radial-gradient(circle at ${pos.x}% ${pos.y}%, rgba(212,168,83,0.06) 0%, transparent 50%)`,
        }}
        aria-hidden="true"
      />
      {/* Top-edge gradient highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-soul/20 to-transparent" aria-hidden="true" />
      {/* Bottom-edge gradient line */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-soul/10 to-transparent" aria-hidden="true" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
