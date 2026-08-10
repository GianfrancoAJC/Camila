"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";
import { Logo } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/client";
import type { Rol } from "@/types";

interface DashboardShellProps {
  children: React.ReactNode;
  rol: Rol;
  nombre: string;
}

export default function DashboardShell({ children, rol, nombre }: DashboardShellProps) {
  const router = useRouter();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar fijo en desktop */}
      <div className="hidden md:flex shrink-0">
        <Sidebar rol={rol} nombre={nombre} onSignOut={handleSignOut} />
      </div>

      {/* Drawer móvil */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(15,23,42,0.32)" }}
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full shadow-xl animate-in">
            <Sidebar rol={rol} nombre={nombre} onSignOut={handleSignOut} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1 min-w-0">
        {/* Barra superior solo móvil */}
        <div
          className="flex md:hidden items-center justify-between px-4 h-14 border-b shrink-0"
          style={{ borderColor: "var(--border)", background: "var(--background)" }}
        >
          <Logo size="sm" />
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="p-2 -mr-2 rounded-lg"
            style={{ color: "var(--muted)" }}
            aria-label="Menú"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
