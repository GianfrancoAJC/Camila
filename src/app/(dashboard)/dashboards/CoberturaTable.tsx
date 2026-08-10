'use client';

interface Fila {
  local_id: string;
  producto_id: string;
  local_nombre: string;
  cod_local: string;
  cadena_codigo: string;
  producto_nombre: string;
  clasificacion: string;
  stock: number;
  dias_cobertura: number | null;
  semaforo: 'quiebre' | 'critico' | 'bajo' | 'ok' | 'sin_rotacion';
  departamento: string | null;
}

const SEMAFORO: Record<string, { label: string; color: string }> = {
  quiebre: { label: 'Quiebre', color: '#ef4444' },
  critico: { label: 'Crítico', color: '#f97316' },
  bajo: { label: 'Bajo', color: '#f59e0b' },
  ok: { label: 'OK', color: '#22c55e' },
  sin_rotacion: { label: 'Sin rotación', color: '#94a3b8' },
};

export function CoberturaTable({ cobertura }: { cobertura: Fila[] }) {
  if (cobertura.length === 0) {
    return (
      <div className="rounded-xl border p-8 text-center text-sm" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
        Sin alertas de stock para este filtro — todo en niveles saludables.
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
        Productos clasificación A/AA/B en quiebre, crítico (&le;7 días) o bajo (&le;15 días) de cobertura, ordenados por urgencia.
        Se excluyen C/NE por su rotación naturalmente baja e irregular.
      </p>
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'color-mix(in srgb, var(--border) 30%, transparent)' }}>
              {['Estado', 'Producto', 'Local', 'Cadena', 'Stock', 'Días cobertura'].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: 'var(--muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cobertura.map((c) => {
              const sem = SEMAFORO[c.semaforo] ?? SEMAFORO.sin_rotacion;
              return (
                <tr key={`${c.local_id}-${c.producto_id}`} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-4 py-2.5">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ color: sem.color, background: `${sem.color}20` }}
                    >
                      {sem.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--foreground)' }}>
                    {c.producto_nombre}
                    <span className="text-xs ml-1.5" style={{ color: 'var(--muted)' }}>[{c.clasificacion}]</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--muted)' }}>
                    {c.local_nombre} {c.departamento ? `· ${c.departamento}` : ''}
                  </td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--muted)' }}>{c.cadena_codigo}</td>
                  <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--foreground)' }}>{c.stock}</td>
                  <td className="px-4 py-2.5 text-sm font-medium" style={{ color: sem.color }}>
                    {c.dias_cobertura ?? '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
