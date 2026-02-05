"use client";

import { cn } from "@/lib/utils/cn";

interface SigilLoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function SigilLoader({ size = "md", className }: SigilLoaderProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      {/* Outer ring */}
      <svg
        className="absolute inset-0 animate-[sigil-pulse_1.5s_ease-in-out_infinite]"
        viewBox="0 0 50 50"
        fill="none"
      >
        <circle
          cx="25"
          cy="25"
          r="23"
          stroke="var(--sigil)"
          strokeWidth="1"
          opacity="0.5"
        />
        <circle
          cx="25"
          cy="25"
          r="18"
          stroke="var(--soul)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          className="animate-[spin_8s_linear_infinite]"
        />
      </svg>
      {/* Inner glow */}
      <div
        className="absolute rounded-full animate-[sigil-pulse_1.5s_ease-in-out_infinite]"
        style={{
          width: "40%",
          height: "40%",
          background: "radial-gradient(circle, var(--soul-glow) 0%, transparent 70%)",
        }}
      />
      {/* Center dot */}
      <div
        className="relative w-2 h-2 rounded-full bg-soul"
        style={{
          boxShadow: "0 0 10px var(--soul-glow), 0 0 20px var(--soul-glow)",
        }}
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
