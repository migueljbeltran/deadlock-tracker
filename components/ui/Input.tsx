import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-md border border-border-subtle bg-[rgba(22,27,34,0.92)] px-3 py-2 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]",
          "text-sm text-text-primary placeholder:italic placeholder:text-text-muted",
          "transition-all duration-200",
          "focus:border-soul focus:outline-none focus:ring-2 focus:ring-soul-glow focus:shadow-glow-soul",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
