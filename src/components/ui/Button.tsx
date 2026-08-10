'use client';

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, React.CSSProperties> = {
  primary: { background: "var(--primary)", color: "var(--primary-foreground)" },
  secondary: { background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" },
  ghost: { background: "transparent", color: "var(--muted)" },
};

const SIZES: Record<Size, string> = {
  sm: "text-xs px-2.5 py-1.5 gap-1.5 rounded-lg",
  md: "text-sm px-4 py-2 gap-2 rounded-lg",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90",
        SIZES[size],
        className
      )}
      style={VARIANTS[variant]}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={size === "sm" ? 12 : 14} className="animate-spin" />}
      {children}
    </button>
  );
}
