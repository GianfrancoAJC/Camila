"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error("Supabase auth error:", error);
      setError(error.message || error.name || JSON.stringify(error));
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: usuario } = await supabase
          .from("usuarios")
          .select("empresa_id")
          .eq("id", user.id)
          .single();
        if (usuario) {
          await supabase.from("eventos_uso").insert({
            empresa_id: usuario.empresa_id,
            usuario_id: user.id,
            tipo: "login",
            metadata: {},
          });
        }
      }
    } catch {
      // No bloquear el login si falla el registro del evento
    }

    router.push("/chat");
    router.refresh();
  }

  const inputStyle = {
    background: "var(--input)",
    borderColor: "var(--border)",
    color: "var(--foreground)",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          className="block text-xs font-medium mb-1.5"
          style={{ color: "var(--foreground)" }}
        >
          Correo electrónico
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 transition-all"
          style={{
            ...inputStyle,
            outline: "none",
          }}
          placeholder="tu@correo.com"
        />
      </div>

      <div>
        <label
          className="block text-xs font-medium mb-1.5"
          style={{ color: "var(--foreground)" }}
        >
          Contraseña
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all"
          style={inputStyle}
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p className="text-xs rounded-lg px-3 py-2" style={{ background: "var(--destructive-tint)", color: "var(--destructive)" }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 rounded-lg text-sm font-medium transition-opacity"
        style={{
          background: "var(--primary)",
          color: "var(--primary-foreground)",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
