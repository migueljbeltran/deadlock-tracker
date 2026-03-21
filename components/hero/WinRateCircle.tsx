"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils/cn";

interface WinRateCircleProps {
  winRate: number;
  size?: number;
}

const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function WinRateCircle({ winRate, size = 80 }: WinRateCircleProps) {
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: true });

  const filled = (winRate / 100) * CIRCUMFERENCE;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 60 60"
        className="-rotate-90"
      >
        <defs>
          <filter id="glow-filter">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Background track */}
        <circle
          cx="30"
          cy="30"
          r={RADIUS}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth="6"
        />
        {/* Animated arc */}
        <motion.circle
          cx="30"
          cy="30"
          r={RADIUS}
          fill="none"
          stroke={winRate >= 50 ? "var(--soul)" : "var(--blood)"}
          strokeWidth="6"
          filter="url(#glow-filter)"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={isInView ? { strokeDashoffset: CIRCUMFERENCE - filled } : {}}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
        />
      </svg>
      {/* Center text */}
      <span className={cn(
        "absolute font-mono text-sm",
        winRate >= 50 ? "text-soul" : "text-blood",
      )}>
        {winRate.toFixed(0)}%
      </span>
    </div>
  );
}
