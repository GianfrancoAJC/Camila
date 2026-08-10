import { cn } from "@/lib/utils";

type Tono = "neutral" | "primary" | "success" | "warning" | "danger";

const TONOS: Record<Tono, { color: string; bg: string }> = {
  neutral: { color: "var(--muted)", bg: "color-mix(in srgb, var(--muted) 12%, transparent)" },
  primary: { color: "var(--primary)", bg: "color-mix(in srgb, var(--primary) 12%, transparent)" },
  success: { color: "var(--success)", bg: "var(--success-tint)" },
  warning: { color: "var(--warning)", bg: "var(--warning-tint)" },
  danger: { color: "var(--destructive)", bg: "var(--destructive-tint)" },
};

export function Badge({
  tono = "neutral",
  className,
  children,
}: {
  tono?: Tono;
  className?: string;
  children: React.ReactNode;
}) {
  const t = TONOS[tono];
  return (
    <span
      className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap", className)}
      style={{ color: t.color, background: t.bg }}
    >
      {children}
    </span>
  );
}
