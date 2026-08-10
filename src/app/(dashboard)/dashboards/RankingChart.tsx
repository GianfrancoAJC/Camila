'use client';

import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { MetricToggle, type Metrica } from './MetricToggle';

interface Fila {
  producto_id: string;
  producto_nombre: string;
  clasificacion: string;
  total_unidades: number;
  total_neto: number;
}

const CLASIF_COLOR: Record<string, string> = {
  A: '#22c55e', AA: '#3b82f6', B: '#f59e0b', C: '#94a3b8', NE: '#cbd5e1',
};

function formatSoles(n: number) {
  return `S/ ${n.toLocaleString('es-PE', { maximumFractionDigits: 0 })}`;
}

function formatUnidades(n: number) {
  return n.toLocaleString('es-PE', { maximumFractionDigits: 0 });
}

export function RankingChart({ ranking }: { ranking: Fila[] }) {
  const [metrica, setMetrica] = useState<Metrica>('valor');

  const agregado = useMemo(() => {
    const porProducto = new Map<string, { nombre: string; clasificacion: string; unidades: number; neto: number }>();
    for (const r of ranking) {
      const cur = porProducto.get(r.producto_id) ?? { nombre: r.producto_nombre, clasificacion: r.clasificacion, unidades: 0, neto: 0 };
      cur.unidades += Number(r.total_unidades);
      cur.neto += Number(r.total_neto);
      porProducto.set(r.producto_id, cur);
    }
    return Array.from(porProducto.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => (metrica === 'valor' ? b.neto - a.neto : b.unidades - a.unidades))
      .slice(0, 15);
  }, [ranking, metrica]);

  if (agregado.length === 0) {
    return (
      <div className="rounded-xl border p-8 text-center text-sm" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
        Sin datos para este filtro
      </div>
    );
  }

  const formatter = metrica === 'valor' ? formatSoles : formatUnidades;
  const chartData = agregado.map((r) => ({
    nombre: r.nombre.length > 22 ? r.nombre.slice(0, 22) + '…' : r.nombre,
    valor: metrica === 'valor' ? r.neto : r.unidades,
    clasificacion: r.clasificacion,
  }));

  return (
    <div>
      <div className="flex justify-end mb-3">
        <MetricToggle value={metrica} onChange={setMetrica} />
      </div>

      <div className="rounded-xl border p-4 mb-5" style={{ borderColor: 'var(--border)' }}>
        <ResponsiveContainer width="100%" height={Math.max(280, chartData.length * 28)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
            <CartesianGrid horizontal={false} stroke="var(--border)" />
            <XAxis type="number" tickFormatter={(v) => formatter(Number(v))} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
            <YAxis type="category" dataKey="nombre" width={160} tick={{ fontSize: 11, fill: 'var(--foreground)' }} />
            <Tooltip
              formatter={(v) => formatter(Number(v))}
              contentStyle={{ borderRadius: 8, borderColor: 'var(--border)', fontSize: 12 }}
            />
            <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={CLASIF_COLOR[entry.clasificacion] ?? '#94a3b8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'color-mix(in srgb, var(--border) 30%, transparent)' }}>
              {['Producto', 'Clasif.', 'Unidades', 'Neto S/'].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: 'var(--muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {agregado.map((r) => (
              <tr key={r.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--foreground)' }}>{r.nombre}</td>
                <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--muted)' }}>{r.clasificacion}</td>
                <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--foreground)' }}>{formatUnidades(r.unidades)}</td>
                <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--foreground)' }}>{formatSoles(r.neto)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
