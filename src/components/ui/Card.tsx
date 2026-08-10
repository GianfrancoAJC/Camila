import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border overflow-hidden", className)}
      style={{ borderColor: "var(--border)", background: "var(--card)", boxShadow: "var(--shadow-sm)" }}
      {...props}
    >
      {children}
    </div>
  );
}
