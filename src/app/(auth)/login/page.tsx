import LoginForm from "./LoginForm";
import { Logo } from "@/components/ui/Logo";
import { BRAND } from "@/lib/brand";

export const metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--background-subtle)" }}
    >
      <div className="w-full max-w-sm animate-in">
        <div className="flex flex-col items-center text-center mb-7">
          <Logo size="lg" showWordmark={false} />
          <h1 className="text-xl font-semibold tracking-tight mt-3.5" style={{ color: "var(--foreground)" }}>
            {BRAND.name}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            {BRAND.tagline}
          </p>
        </div>

        <div
          className="rounded-xl border p-6"
          style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow)" }}
        >
          <h2 className="text-sm font-medium mb-5" style={{ color: "var(--foreground)" }}>
            Iniciar sesión
          </h2>
          <LoginForm />
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "var(--muted-foreground)" }}>
          Acceso exclusivo para cuentas autorizadas.
        </p>
      </div>
    </div>
  );
}
