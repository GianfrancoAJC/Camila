'use client';

import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { MetricToggle, type Metrica } from './MetricToggle';

interface FilaTendencia {
  periodo: string;
  total_unidades: number;
  total_neto: number;
}

interface FilaProducto {
  producto_id: string;
  producto_nombre: string;
  clasificacion: string;
  periodo: string;
  total_unidades: number;
  total_neto: number;
}

function formatPeriodo(p: string) {
  const [anio, mes] = p.split('-');
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${meses[parseInt(mes, 10) - 1] ?? mes} ${anio.slice(2)}`;
}

function formatSoles(n: number) {
  return `S/ ${n.toLocaleString('es-PE', { maximumFractionDigits: 0 })}`;
}

export function RotacionChart({
  tendencia,
  serieProducto,
  topProductosRango,
  productoActivo,
}: {
  tendencia: FilaTendencia[];
  serieProducto: FilaProducto[];
  topProductosRango: FilaProducto[];
  productoActivo: string;
}) {
  const [metrica, setMetrica] = useState<Metrica>('unidades');
  const modoProducto = !!productoActivo;

  const trend = useMemo(() => {
    const porPeriodo = new Map<string, { periodo: string; unidades: number; neto: number }>();
    const fuente = modoProducto ? serieProducto : tendencia;
    for (const r of fuente) {
      const cur = porPeriodo.get(r.periodo) ?? { periodo: r.periodo, unidades: 0, neto: 0 };
      cur.unidades += Number(r.total_unidades);
      cur.neto += Number(r.total_neto);
      porPeriodo.set(r.periodo, cur);
    }
    return Array.from(porPeriodo.values())
      .sort((a, b) => a.periodo.localeCompare(b.periodo))
      .map((p) => ({ ...p, label: formatPeriodo(p.periodo) }));
  }, [modoProducto, serieProducto, tendencia]);

  const topProductos = useMemo(() => {
    const porProducto = new Map<string, { nombre: string; clasificacion: string; unidades: number; neto: number }>();
    for (const r of topProductosRango) {
      const cur = porProducto.get(r.producto_id) ?? { nombre: r.producto_nombre, clasificacion: r.clasificacion, unidades: 0, neto: 0 };
      cur.unidades += Number(r.total_unidades);
      cur.neto += Number(r.total_neto);
      porProducto.set(r.producto_id, cur);
    }
    return Array.from(porProducto.values()).sort((a, b) => b.neto - a.neto).slice(0, 12);
  }, [topProductosRango]);

  if (trend.length === 0) {
    return (
      <div className="rounded-xl border p-8 text-center text-sm" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
        {modoProducto ? 'Sin ventas de este producto en el rango seleccionado' : 'Sin datos para este rango'}
      </div>
    );
  }

  const dataKey = metrica === 'valor' ? 'neto' : 'unidades';
  const lineLabel = metrica === 'valor' ? 'Valor S/' : 'Unidades';
  const tooltipFormatter = metrica === 'valor' ? (v: number) => formatSoles(v) : undefined;

  return (
    <div>
      <div className="flex justify-end mb-3">
        <MetricToggle value={metrica} onChange={setMetrica} />
      </div>

      <div className="rounded-xl border p-4 mb-5" style={{ borderColor: 'var(--border)' }}>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={trend} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} />
            <Tooltip
              formatter={tooltipFormatter as never}
              contentStyle={{ borderRadius: 8, borderColor: 'var(--border)', fontSize: 12 }}
            />
            <Line type="monotone" dataKey={dataKey} name={lineLabel} stroke="#3b82f6" strokeWidth={2} dot={trend.length <= 12} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {!modoProducto && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'color-mix(in srgb, var(--border) 30%, transparent)' }}>
                {['Producto', 'Clasif.', 'Unidades (rango)', 'Neto S/ (rango)'].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: 'var(--muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topProductos.map((p) => (
                <tr key={p.nombre} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--foreground)' }}>{p.nombre}</td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--muted)' }}>{p.clasificacion}</td>
                  <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--foreground)' }}>{p.unidades.toLocaleString('es-PE')}</td>
                  <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--foreground)' }}>{formatSoles(p.neto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
