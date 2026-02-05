"use client";

import { cn } from "@/lib/utils/cn";

interface SigilBackgroundProps {
  className?: string;
  intensity?: "subtle" | "medium" | "strong";
}

export function SigilBackground({ className, intensity = "subtle" }: SigilBackgroundProps) {
  const opacityMap = {
    subtle: "opacity-[0.08]",
    medium: "opacity-[0.15]",
    strong: "opacity-[0.25]",
  };

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        opacityMap[intensity],
        className
      )}
      aria-hidden="true"
    >
      <svg
        className="absolute h-full w-full"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        stroke="var(--sigil)"
        strokeWidth="0.5"
      >
        {/* Central radiating pattern */}
        <g transform="translate(400, 300)">
          {/* Outer circles */}
          <circle r="250" />
          <circle r="200" strokeDasharray="8 4" />
          <circle r="150" />
          <circle r="100" strokeDasharray="4 8" />
          <circle r="50" />

          {/* Radiating lines */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const x = Math.cos(angle) * 280;
            const y = Math.sin(angle) * 280;
            return (
              <line
                key={i}
                x1="0"
                y1="0"
                x2={x}
                y2={y}
                strokeDasharray="2 6"
              />
            );
          })}

          {/* Geometric accents */}
          <polygon
            points="0,-80 69.3,40 -69.3,40"
            strokeWidth="0.75"
          />
          <polygon
            points="0,80 -69.3,-40 69.3,-40"
            strokeWidth="0.75"
          />
        </g>

        {/* Corner accents */}
        <g stroke="var(--sigil)" strokeWidth="0.5">
          {/* Top left */}
          <path d="M0,100 Q50,50 100,0" />
          <path d="M0,150 Q75,75 150,0" />

          {/* Top right */}
          <path d="M800,100 Q750,50 700,0" />
          <path d="M800,150 Q725,75 650,0" />

          {/* Bottom left */}
          <path d="M0,500 Q50,550 100,600" />
          <path d="M0,450 Q75,525 150,600" />

          {/* Bottom right */}
          <path d="M800,500 Q750,550 700,600" />
          <path d="M800,450 Q725,525 650,600" />
        </g>
      </svg>
    </div>
  );
}
