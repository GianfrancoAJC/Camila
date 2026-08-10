import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--background-subtle)" }}
    >
      <div className="text-center animate-in">
        <div className="flex justify-center mb-5">
          <Logo size="lg" showWordmark={false} />
        </div>
        <p className="text-5xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>404</p>
        <p className="text-sm mt-2 mb-6" style={{ color: "var(--muted)" }}>
          La página que buscas no existe o fue movida.
        </p>
        <Link
          href="/chat"
          className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
