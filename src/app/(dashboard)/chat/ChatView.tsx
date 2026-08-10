'use client';

import { useRef, useState, useEffect } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { SkillCard } from './SkillCard';
import type { ChartSpec } from '@/lib/skills/types';

interface MensajeUI {
  role: 'user' | 'assistant';
  content: string;
  chart_spec?: ChartSpec | null;
}

const EJEMPLOS = [
  'Muéstrame la tendencia de VALTERO 500 en BP los últimos 6 meses',
  '¿Qué productos están en riesgo de quiebre de stock?',
  'Top 5 productos por venta en HYS en el último mes',
];

export function ChatView({
  sesionInicial,
  mensajesIniciales,
}: {
  sesionInicial: string | null;
  mensajesIniciales: MensajeUI[];
}) {
  const [sesionId, setSesionId] = useState<string | null>(sesionInicial);
  const [mensajes, setMensajes] = useState<MensajeUI[]>(mensajesIniciales);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [mensajes, loading]);

  async function enviar(texto: string) {
    const mensaje = texto.trim();
    if (!mensaje || loading) return;
    setError('');
    setInput('');
    setMensajes((m) => [...m, { role: 'user', content: mensaje }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sesion_id: sesionId, mensaje }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al consultar el asistente');
      setSesionId(json.sesion_id);
      setMensajes((m) => [...m, { role: 'assistant', content: json.mensaje.content, chart_spec: json.mensaje.chart_spec }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    enviar(input);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b flex items-center" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h1 className="text-base font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>Chat</h1>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Consulta tus datos en lenguaje natural</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
        {mensajes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center animate-in">
            <div className="max-w-xl w-full text-center">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--accent)' }}
              >
                <Sparkles size={22} style={{ color: 'var(--primary)' }} />
              </div>
              <h2 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>¿Qué quieres saber hoy?</h2>
              <p className="text-sm mt-1.5 mb-5" style={{ color: 'var(--muted)' }}>
                Pregúntame sobre ventas, stock, cobertura o tendencias de tus productos.
              </p>
              <div className="grid gap-2">
                {EJEMPLOS.map((ej) => (
                  <button
                    key={ej}
                    onClick={() => enviar(ej)}
                    className="flex items-center gap-2.5 text-left text-sm w-full rounded-lg border px-3.5 py-2.5 transition-colors hover:bg-black/[0.02]"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--card)' }}
                  >
                    <Sparkles size={13} style={{ color: 'var(--primary)' }} className="shrink-0" />
                    {ej}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {mensajes.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className={m.role === 'user' ? 'max-w-[80%]' : 'max-w-[90%] w-full'}>
                  <div
                    className="px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap"
                    style={
                      m.role === 'user'
                        ? { background: 'var(--primary)', color: '#fff', borderBottomRightRadius: 4 }
                        : { background: 'var(--secondary)', color: 'var(--foreground)', border: '1px solid var(--border)', borderBottomLeftRadius: 4 }
                    }
                  >
                    {m.content}
                  </div>
                  {m.role === 'assistant' && m.chart_spec && <SkillCard spec={m.chart_spec} />}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-4 py-2.5 rounded-2xl flex items-center gap-2" style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}>
                  <Loader2 size={14} className="animate-spin" style={{ color: 'var(--muted)' }} />
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>Pensando...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
        {error && <p className="text-xs text-red-500 mb-2 max-w-3xl mx-auto">{error}</p>}
        <form onSubmit={handleSubmit} className="flex items-center gap-3 px-4 py-3 rounded-xl border max-w-3xl mx-auto" style={{ background: 'var(--input)', borderColor: 'var(--border)' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu consulta..."
            disabled={loading}
            className="flex-1 bg-transparent outline-none text-sm disabled:opacity-50"
            style={{ color: 'var(--foreground)' }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity disabled:opacity-50"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            <Send size={12} />
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
