import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-md bg-[rgba(22,27,34,0.6)] backdrop-blur-xl border border-[rgba(48,54,61,0.6)] shadow-[var(--shadow-inner-highlight),var(--shadow-depth-sm)] card-shimmer",
          hoverable && [
            "transition-all duration-200",
            "hover:border-soul hover:bg-surface-elevated",
            "hover:shadow-[0_0_30px_rgba(61,220,132,0.1)]",
          ],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-4 py-3 border-b border-b-transparent bg-[length:100%_1px] bg-[position:bottom] bg-no-repeat", className)}
      style={{ backgroundImage: "linear-gradient(to right, transparent, rgba(48,54,61,0.5), transparent)" }}
      {...props}
    />
  )
);

CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("font-heading text-lg text-amber", className)}
      style={{ textShadow: "0 0 20px rgba(212,168,83,0.3)" }}
      {...props}
    />
  )
);

CardTitle.displayName = "CardTitle";

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-4", className)} {...props} />
  )
);

CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardContent };
