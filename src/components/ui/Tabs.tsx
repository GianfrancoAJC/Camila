'use client';

import type { LucideIcon } from "lucide-react";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: LucideIcon;
  badge?: number;
}

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: readonly TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex items-center gap-1 mb-6 border-b overflow-x-auto" style={{ borderColor: "var(--border)" }}>
      {tabs.map(({ id, label, icon: Icon, badge }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px border-b-2 whitespace-nowrap"
            style={{
              color: isActive ? "var(--primary)" : "var(--muted)",
              borderColor: isActive ? "var(--primary)" : "transparent",
            }}
          >
            {Icon && <Icon size={14} />}
            {label}
            {badge !== undefined && badge > 0 && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none"
                style={{ background: "var(--destructive)", color: "#fff" }}
              >
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
