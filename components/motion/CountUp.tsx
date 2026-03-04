"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { formatNumber } from "@/lib/utils/format";

interface CountUpProps {
  value: number;
  duration?: number;
  className?: string;
  /** Format the number with commas via formatNumber. Defaults to true. */
  formatted?: boolean;
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

export function CountUp({
  value,
  duration = 1.5,
  className,
  formatted = true,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!isInView) return;

    const start = performance.now();
    const durationMs = duration * 1000;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = easeOutQuart(progress);
      const current = Math.round(eased * value);

      setDisplay(formatted ? formatNumber(current) : String(current));

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }, [isInView, value, duration, formatted]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
