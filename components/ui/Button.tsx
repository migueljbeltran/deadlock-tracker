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
          "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soul focus-visible:ring-offset-2 focus-visible:ring-offset-deep",
          "disabled:pointer-events-none disabled:opacity-50",
          // Variants
          variant === "primary" && [
            "border border-soul bg-transparent text-soul",
            "hover:bg-soul hover:text-deep",
            "active:bg-soul-dim",
          ],
          variant === "secondary" && [
            "border border-border-subtle bg-transparent text-text-secondary",
            "hover:border-amber hover:text-amber",
          ],
          variant === "ghost" && [
            "bg-transparent text-text-secondary",
            "hover:bg-surface-elevated hover:text-text-primary",
          ],
          // Sizes
          size === "sm" && "h-8 px-3 text-sm rounded",
          size === "md" && "h-10 px-4 text-sm rounded",
          size === "lg" && "h-12 px-6 text-base rounded",
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
