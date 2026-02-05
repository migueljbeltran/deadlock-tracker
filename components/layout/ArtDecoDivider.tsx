import { cn } from "@/lib/utils/cn";

interface ArtDecoDividerProps {
  className?: string;
  variant?: "simple" | "ornate";
}

export function ArtDecoDivider({ className, variant = "simple" }: ArtDecoDividerProps) {
  if (variant === "simple") {
    return (
      <div className={cn("flex items-center justify-center py-4", className)}>
        <svg
          viewBox="0 0 400 20"
          className="w-full max-w-md h-5"
          fill="none"
          stroke="var(--amber)"
          strokeWidth="1"
        >
          <line x1="0" y1="10" x2="175" y2="10" />
          <circle cx="200" cy="10" r="4" />
          <line x1="225" y1="10" x2="400" y2="10" />
        </svg>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center py-6", className)}>
      <svg
        viewBox="0 0 500 40"
        className="w-full max-w-lg h-10"
        fill="none"
      >
        {/* Left decorative element */}
        <g stroke="var(--amber)" strokeWidth="1">
          <line x1="0" y1="20" x2="150" y2="20" />
          <line x1="150" y1="20" x2="170" y2="10" />
          <line x1="150" y1="20" x2="170" y2="30" />
        </g>

        {/* Center ornament */}
        <g transform="translate(250, 20)">
          <circle r="8" fill="none" stroke="var(--amber)" strokeWidth="1.5" />
          <circle r="3" fill="var(--amber)" />
          {/* Radiating points */}
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
        </g>

        {/* Right decorative element */}
        <g stroke="var(--amber)" strokeWidth="1">
          <line x1="350" y1="20" x2="500" y2="20" />
          <line x1="330" y1="10" x2="350" y2="20" />
          <line x1="330" y1="30" x2="350" y2="20" />
        </g>
      </svg>
    </div>
  );
}
