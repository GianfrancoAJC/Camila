'use client';

import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { PeruMap } from '../dashboards/PeruMap';
import type { ChartSpec } from '@/lib/skills/types';

function formatSoles(n: number) {
  return `S/ ${n.toLocaleString('es-PE', { maximumFractionDigits: 0 })}`;
}

const SEMAFORO_COLOR: Record<string, string> = {
  Quiebre: '#ef4444',
  Crítico: '#f97316',
  Bajo: '#f59e0b',
};

function KpiCard({ spec }: { spec: Extract<ChartSpec, { type: 'kpi' }> }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {spec.items.map((item) => (
        <div key={item.label} className="rounded-lg border p-3" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>{item.label}</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function LineCard({ spec }: { spec: Extract<ChartSpec, { type: 'line' }> }) {
  const data = spec.data.map((d) => ({ ...d, label: spec.xLabels[String(d[spec.xKey])] ?? String(d[spec.xKey]) }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} />
        <Tooltip contentStyle={{ borderRadius: 8, borderColor: 'var(--border)', fontSize: 12 }} />
        {spec.series.map((s) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke="#3b82f6" strokeWidth={2} dot={data.length <= 12} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function BarCard({ spec }: { spec: Extract<ChartSpec, { type: 'bar' }> }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, spec.data.length * 28)}>
      <BarChart
        data={spec.data}
        layout={spec.horizontal ? 'vertical' : 'horizontal'}
        margin={{ left: 8, right: 24, top: 8, bottom: 8 }}
      >
        <CartesianGrid stroke="var(--border)" horizontal={!spec.horizontal} vertical={!!spec.horizontal} />
        {spec.horizontal ? (
          <>
            <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
            <YAxis type="category" dataKey={spec.xKey} width={140} tick={{ fontSize: 11, fill: 'var(--foreground)' }} />
          </>
        ) : (
          <>
            <XAxis dataKey={spec.xKey} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} />
          </>
        )}
        <Tooltip contentStyle={{ borderRadius: 8, borderColor: 'var(--border)', fontSize: 12 }} />
        {spec.series.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} fill="#3b82f6" radius={spec.horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

function TableCard({ spec }: { spec: Extract<ChartSpec, { type: 'table' }> }) {
  return (
    <div className="rounded-lg border overflow-hidden overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: 'color-mix(in srgb, var(--border) 30%, transparent)' }}>
            {spec.columns.map((c) => (
              <th key={c.key} className="text-left px-3 py-2 text-xs font-medium whitespace-nowrap" style={{ color: 'var(--muted)' }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {spec.rows.map((row, i) => (
            <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
              {spec.columns.map((c) => {
                const val = row[c.key];
                const isEstado = c.key === 'estado';
                const color = isEstado ? SEMAFORO_COLOR[String(val)] : undefined;
                return (
                  <td key={c.key} className="px-3 py-2 text-xs whitespace-nowrap" style={{ color: color ?? 'var(--foreground)' }}>
                    {color ? (
                      <span className="font-medium px-2 py-0.5 rounded-full" style={{ background: `${color}20` }}>{String(val)}</span>
                    ) : (
                      String(val)
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HeatmapCard({ spec }: { spec: Extract<ChartSpec, { type: 'heatmap' }> }) {
  const max = Math.max(1, ...spec.cells.map((c) => c.value));
  const cellMap = new Map(spec.cells.map((c) => [`${c.row}|${c.col}`, c.value]));
  return (
    <div className="rounded-lg border overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
      <table className="text-xs">
        <thead>
          <tr>
            <th className="text-left px-2 py-1.5 sticky left-0" style={{ background: 'var(--background)', color: 'var(--muted)' }}>{spec.rowLabel}</th>
            {spec.cols.map((c) => (
              <th key={c} className="px-2 py-1.5 text-center font-medium whitespace-nowrap" style={{ color: 'var(--muted)' }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {spec.rows.map((r) => (
            <tr key={r} style={{ borderTop: '1px solid var(--border)' }}>
              <td className="px-2 py-1.5 sticky left-0 whitespace-nowrap" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>{r}</td>
              {spec.cols.map((c) => {
                const v = cellMap.get(`${r}|${c}`) ?? 0;
                const t = v / max;
                return (
                  <td key={c} className="px-2 py-1.5 text-center" style={{ background: `rgba(59,130,246,${t * 0.6})`, color: t > 0.5 ? '#fff' : 'var(--foreground)' }}>
                    {v || ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MapCard({ spec }: { spec: Extract<ChartSpec, { type: 'map' }> }) {
  return (
    <div>
      <PeruMap datos={spec.datos} productoNombre={spec.productoNombre} />
      {spec.topDepartamentos.length > 0 && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
          {spec.topDepartamentos.map((d) => (
            <div key={d.departamento} className="rounded-lg border p-2" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>{d.departamento}</p>
              {d.zona && <p className="text-[10px]" style={{ color: 'var(--muted)' }}>Zona {d.zona}</p>}
              <p className="text-xs" style={{ color: 'var(--primary)' }}>{formatSoles(d.total_neto)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SkillCard({ spec }: { spec: ChartSpec }) {
  return (
    <div className="mt-2 p-3 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--secondary)' }}>
      {spec.type === 'kpi' && <KpiCard spec={spec} />}
      {spec.type === 'line' && <LineCard spec={spec} />}
      {spec.type === 'bar' && <BarCard spec={spec} />}
      {spec.type === 'table' && <TableCard spec={spec} />}
      {spec.type === 'heatmap' && <HeatmapCard spec={spec} />}
      {spec.type === 'map' && <MapCard spec={spec} />}
    </div>
  );
}
