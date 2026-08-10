import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = "neutral",
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  tone?: "neutral" | "success";
}) {
  const iconColor = tone === "success" ? "var(--success)" : "var(--muted-foreground)";
  const iconBg = tone === "success" ? "var(--success-tint)" : "var(--secondary)";
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
        style={{ background: iconBg }}
      >
        <Icon size={20} style={{ color: iconColor }} />
      </div>
      <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
        {title}
      </p>
      {description && (
        <p className="text-sm mt-1 max-w-sm" style={{ color: "var(--muted)" }}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
