"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface ArtDecoDividerProps {
  className?: string;
  variant?: "simple" | "ornate";
}

const draw = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.8, ease: "easeInOut" as const },
  },
};

const scaleIn = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.5, delay: 0.4, ease: [0.34, 1.56, 0.64, 1] as const },
  },
};

export function ArtDecoDivider({ className, variant = "simple" }: ArtDecoDividerProps) {
  if (variant === "simple") {
    return (
      <div className={cn("flex items-center justify-center py-4", className)}>
        <motion.svg
          viewBox="0 0 400 20"
          className="w-full max-w-md h-5"
          fill="none"
          stroke="var(--amber)"
          strokeWidth="1"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.line x1="0" y1="10" x2="175" y2="10" variants={draw} />
          <motion.circle cx="200" cy="10" r="4" variants={scaleIn} fill="none" />
          <motion.line x1="225" y1="10" x2="400" y2="10" variants={draw} />
        </motion.svg>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center py-6", className)}>
      <motion.svg
        viewBox="0 0 500 40"
        className="w-full max-w-lg h-10"
        fill="none"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {/* Left decorative element */}
        <g stroke="var(--amber)" strokeWidth="1">
          <motion.line x1="0" y1="20" x2="150" y2="20" variants={draw} />
          <motion.line x1="150" y1="20" x2="170" y2="10" variants={draw} />
          <motion.line x1="150" y1="20" x2="170" y2="30" variants={draw} />
        </g>

        {/* Center ornament */}
        <motion.g transform="translate(250, 20)" variants={scaleIn}>
          <circle r="8" fill="none" stroke="var(--amber)" strokeWidth="1.5" />
          <circle r="3" fill="var(--amber)" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const x1 = Math.cos(rad) * 12;
            const y1 = Math.sin(rad) * 12;
            const x2 = Math.cos(rad) * 18;
            const y2 = Math.sin(rad) * 18;
            return (
              <line
                key={angle}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--amber)"
                strokeWidth="1"
              />
            );
          })}
        </motion.g>

        {/* Right decorative element */}
        <g stroke="var(--amber)" strokeWidth="1">
          <motion.line x1="350" y1="20" x2="500" y2="20" variants={draw} />
          <motion.line x1="330" y1="10" x2="350" y2="20" variants={draw} />
          <motion.line x1="330" y1="30" x2="350" y2="20" variants={draw} />
        </g>
      </motion.svg>
    </div>
  );
}
