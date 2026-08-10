"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  BarChart2,
  Upload,
  BookOpen,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import type { Rol } from "@/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: Rol[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/chat", label: "Chat", icon: MessageSquare, roles: ["superadmin", "admin", "colaborador"] },
  { href: "/dashboards", label: "Dashboards", icon: BarChart2, roles: ["superadmin", "admin", "colaborador"] },
  { href: "/ingesta", label: "Ingesta", icon: Upload, roles: ["superadmin", "admin", "colaborador"] },
  { href: "/catalogos", label: "Catálogos", icon: BookOpen, roles: ["superadmin", "admin"] },
  { href: "/administracion", label: "Administración", icon: Settings, roles: ["superadmin", "admin"] },
];

const ROL_LABEL: Record<Rol, string> = { superadmin: "SuperAdmin", admin: "Administrador", colaborador: "Colaborador" };

interface SidebarProps {
  rol: Rol;
  nombre: string;
  onSignOut: () => void;
  onNavigate?: () => void;
}

export default function Sidebar({ rol, nombre, onSignOut, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const itemsVisibles = NAV_ITEMS.filter((item) => item.roles.includes(rol));
  const iniciales = nombre
    .split(" ")
    .slice(0, 2)
    .map((p) => p.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <aside
      className="flex flex-col h-full w-60 border-r"
      style={{ background: "var(--sidebar)", borderColor: "var(--sidebar-border)" }}
    >
      <div className="flex items-center px-4 py-4 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
        <Logo size="md" />
      </div>

      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        {itemsVisibles.map((item) => {
          const Icon = item.icon;
          const activo = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                !activo && "hover:bg-black/[0.04]"
              )}
              style={{
                color: activo ? "var(--primary)" : "var(--foreground)",
                background: activo ? "var(--accent)" : undefined,
                fontWeight: activo ? 500 : 400,
              }}
            >
              <Icon size={16} style={{ color: activo ? "var(--primary)" : "var(--muted)" }} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t" style={{ borderColor: "var(--sidebar-border)" }}>
        <div className="flex items-center gap-2.5 mb-2.5 px-1">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
            style={{ background: "var(--accent)", color: "var(--primary)" }}
          >
            {iniciales}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: "var(--foreground)" }}>{nombre}</p>
            <p className="text-[11px]" style={{ color: "var(--muted)" }}>{ROL_LABEL[rol]}</p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs transition-colors hover:bg-black/[0.04]"
          style={{ color: "var(--muted)" }}
        >
          <LogOut size={13} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
