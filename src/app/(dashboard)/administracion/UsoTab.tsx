'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface FilaUsoDia {
  fecha: string;
  mensajes: number;
  tokens_entrada: number;
  tokens_salida: number;
  costo_estimado: number;
}

interface FilaUsoUsuario {
  usuario_id: string;
  usuario_nombre: string;
  mensajes: number;
  tokens_entrada: number;
  tokens_salida: number;
  costo_estimado: number;
  ultimo_uso: string;
}

function formatFecha(f: string) {
  const d = new Date(f + 'T00:00:00');
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
}

function formatUSD(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
}

export function UsoTab({ usoPorDia, usoPorUsuario }: { usoPorDia: FilaUsoDia[]; usoPorUsuario: FilaUsoUsuario[] }) {
  const totales = useMemo(() => {
    return usoPorDia.reduce(
      (acc, d) => ({
        mensajes: acc.mensajes + Number(d.mensajes),
        tokens: acc.tokens + Number(d.tokens_entrada) + Number(d.tokens_salida),
        costo: acc.costo + Number(d.costo_estimado),
      }),
      { mensajes: 0, tokens: 0, costo: 0 }
    );
  }, [usoPorDia]);

  const chartData = usoPorDia.map((d) => ({ fecha: formatFecha(d.fecha), costo: Number(d.costo_estimado) }));

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Mensajes (30 días)</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{totales.mensajes.toLocaleString('es-PE')}</p>
        </div>
        <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Tokens (30 días)</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{totales.tokens.toLocaleString('es-PE')}</p>
        </div>
        <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Costo estimado (30 días)</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{formatUSD(totales.costo)}</p>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="rounded-xl border p-4 mb-5" style={{ borderColor: 'var(--border)' }}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} />
              <Tooltip formatter={(v) => formatUSD(Number(v))} contentStyle={{ borderRadius: 8, borderColor: 'var(--border)', fontSize: 12 }} />
              <Line type="monotone" dataKey="costo" name="Costo estimado" stroke="#3b82f6" strokeWidth={2} dot={chartData.length <= 15} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'color-mix(in srgb, var(--border) 30%, transparent)' }}>
              {['Usuario', 'Mensajes', 'Tokens', 'Costo estimado', 'Último uso'].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: 'var(--muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usoPorUsuario.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--muted)' }}>Sin uso registrado aún</td>
              </tr>
            ) : (
              usoPorUsuario.map((u) => (
                <tr key={u.usuario_id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--foreground)' }}>{u.usuario_nombre}</td>
                  <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--foreground)' }}>{Number(u.mensajes).toLocaleString('es-PE')}</td>
                  <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--foreground)' }}>{(Number(u.tokens_entrada) + Number(u.tokens_salida)).toLocaleString('es-PE')}</td>
                  <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--foreground)' }}>{formatUSD(Number(u.costo_estimado))}</td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--muted)' }}>{new Date(u.ultimo_uso).toLocaleDateString('es-PE')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
