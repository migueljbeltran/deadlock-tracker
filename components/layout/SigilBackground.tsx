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
      style={{ contain: "strict" }}
    >
      <svg
        className="absolute h-full w-full"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        stroke="var(--sigil)"
        strokeWidth="0.5"
      >
        {/* Central radiating pattern — GPU-composited via CSS class */}
        <g transform="translate(400, 300)" className="sigil-spin-slow">
          {/* Outer circles */}
          <circle r="250" />
          <circle r="200" strokeDasharray="8 4" />
          <circle r="150" />
          <circle r="100" strokeDasharray="4 8" />
          <circle r="50" />

          {/* Radiating lines */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const x = Math.round(Math.cos(angle) * 280 * 100) / 100;
            const y = Math.round(Math.sin(angle) * 280 * 100) / 100;
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

        {/* Secondary smaller sigil — counter-rotation for depth */}
        <g transform="translate(650, 480)" opacity="0.4" className="sigil-spin-reverse">
          <circle r="80" />
          <circle r="60" strokeDasharray="4 4" />
          <circle r="40" />
          <polygon points="0,-35 30.3,17.5 -30.3,17.5" strokeWidth="0.5" />
          <polygon points="0,35 -30.3,-17.5 30.3,-17.5" strokeWidth="0.5" />
        </g>

        {/* Tertiary sigil — amber, different rotation */}
        <g transform="translate(150, 120)" opacity="0.3" className="sigil-spin-medium">
          <circle r="70" stroke="var(--amber)" />
          <circle r="50" strokeDasharray="3 5" stroke="var(--amber)" />
          <circle r="30" stroke="var(--amber)" />
          <polygon points="0,-25 21.7,12.5 -21.7,12.5" strokeWidth="0.5" stroke="var(--amber)" />
          <polygon points="0,25 -21.7,-12.5 21.7,-12.5" strokeWidth="0.5" stroke="var(--amber)" />
        </g>

        {/* Scattered star dots */}
        <circle cx="100" cy="80" r="1" fill="var(--sigil)" className="animate-flicker-slow" />
        <circle cx="700" cy="120" r="1" fill="var(--amber)" className="animate-flicker-slow" />
        <circle cx="300" cy="500" r="0.8" fill="var(--sigil)" className="animate-flicker-medium" />
        <circle cx="550" cy="200" r="1" fill="var(--amber)" className="animate-flicker-slow" />
        <circle cx="180" cy="420" r="0.8" fill="var(--sigil)" className="animate-flicker-medium" />
      </svg>
    </div>
  );
}
