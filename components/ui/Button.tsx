import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soul focus-visible:ring-offset-2 focus-visible:ring-offset-deep",
          "disabled:pointer-events-none disabled:opacity-50",
          // Variants
          variant === "primary" && [
            "btn-shimmer relative overflow-hidden",
            "border border-soul bg-gradient-to-b from-soul/15 to-soul/5 text-soul shadow-depth-sm",
            "hover:bg-gradient-to-b hover:from-soul hover:to-soul-dim hover:text-deep hover:shadow-[0_0_20px_rgba(61,220,132,0.2)]",
            "active:bg-soul-dim",
          ],
          variant === "secondary" && [
            "border border-border-subtle bg-transparent text-text-secondary",
            "hover:border-amber hover:text-amber hover:bg-amber/5 hover:shadow-[0_0_15px_rgba(212,168,83,0.15)]",
          ],
          variant === "ghost" && [
            "bg-transparent text-text-secondary",
            "hover:bg-surface-elevated hover:text-text-primary",
          ],
          // Sizes
          size === "sm" && "h-8 px-3 text-sm rounded-md tracking-wide",
          size === "md" && "h-10 px-4 text-sm rounded-md tracking-wide",
          size === "lg" && "h-12 px-6 text-base rounded-md tracking-wide",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
