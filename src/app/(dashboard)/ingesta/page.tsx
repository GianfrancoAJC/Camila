import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { UploadForm } from './UploadForm';
import { FileText, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

const MESES_ES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function estadoBadge(estado: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    completado: { label: 'Completado', color: '#22c55e', bg: 'color-mix(in srgb, #22c55e 12%, transparent)' },
    procesando: { label: 'Procesando', color: '#3b82f6', bg: 'color-mix(in srgb, #3b82f6 12%, transparent)' },
    error: { label: 'Error', color: '#ef4444', bg: 'color-mix(in srgb, #ef4444 12%, transparent)' },
    pendiente: { label: 'Pendiente', color: '#f59e0b', bg: 'color-mix(in srgb, #f59e0b 12%, transparent)' },
  };
  const s = map[estado] ?? map.pendiente;
  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ color: s.color, background: s.bg }}
    >
      {s.label}
    </span>
  );
}

export default async function IngestaPage() {
  const supabase = await createClient();

  const { data: cargas } = await supabase
    .from('cargas')
    .select(`
      id, nombre, periodo, estado, filas_total, filas_ok, filas_error,
      created_at,
      dim_cadena ( codigo, nombre )
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  const { data: pendientes } = await supabase
    .from('pendientes_mapeo')
    .select('id, tipo, valor_origen, fila_json, estado, cadena_id, dim_cadena(codigo)')
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="px-6 py-8 max-w-5xl">
      <PageHeader title="Ingesta de datos" description="Carga los CSV mensuales de BP y HYS para consolidarlos en la base de datos" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de carga */}
        <div className="rounded-xl border p-6" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 mb-5">
            <FileText size={16} style={{ color: 'var(--primary)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              Nueva carga
            </h2>
          </div>
          <UploadForm />
        </div>

        {/* Resumen de pendientes */}
        <div className="rounded-xl border p-6" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              Pendientes de mapeo
            </h2>
            {(pendientes?.length ?? 0) > 0 && (
              <span
                className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ color: '#f59e0b', background: 'color-mix(in srgb, #f59e0b 12%, transparent)' }}
              >
                {pendientes!.length}
              </span>
            )}
          </div>

          {!pendientes || pendientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <CheckCircle2 size={24} className="text-green-500" />
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Sin pendientes. ¡Todo mapeado!
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {pendientes.map((p) => {
                const fila = p.fila_json as Record<string, string>;
                const cadena = (p.dim_cadena as unknown as { codigo: string } | null)?.codigo ?? '';
                return (
                  <div
                    key={p.id}
                    className="rounded-lg px-3 py-2.5 flex items-start gap-3"
                    style={{ background: 'color-mix(in srgb, var(--border) 40%, transparent)' }}
                  >
                    <span
                      className="text-xs font-medium px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                      style={{ color: 'var(--primary)', background: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}
                    >
                      {cadena}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-mono truncate" style={{ color: 'var(--foreground)' }}>
                        {p.valor_origen}
                      </p>
                      {fila?.nombre_producto && (
                        <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
                          {fila.nombre_producto}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {(pendientes?.length ?? 0) > 0 && (
            <p className="text-xs mt-4" style={{ color: 'var(--muted)' }}>
              Ve a <strong>Catálogos → Pendientes</strong> para asignar cada código a un producto.
            </p>
          )}
        </div>
      </div>

      {/* Historial de cargas */}
      {cargas && cargas.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={15} style={{ color: 'var(--muted)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              Historial de cargas
            </h2>
          </div>

          <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'color-mix(in srgb, var(--border) 30%, transparent)' }}>
                  {['Archivo', 'Cadena', 'Periodo', 'Filas', 'Estado'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-2.5 text-xs font-medium"
                      style={{ color: 'var(--muted)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cargas.map((c, i) => {
                  const cadena = (c.dim_cadena as unknown as { codigo: string; nombre: string } | null);
                  const fecha = new Date(c.periodo + 'T00:00:00');
                  return (
                    <tr
                      key={c.id}
                      style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs truncate max-w-48 block" style={{ color: 'var(--foreground)' }}>
                          {c.nombre}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>
                          {cadena?.codigo ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>
                        {MESES_ES[fecha.getMonth() + 1]} {fecha.getFullYear()}
                      </td>
                      <td className="px-4 py-3">
                        {c.filas_total != null ? (
                          <span className="text-xs" style={{ color: 'var(--muted)' }}>
                            <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>{c.filas_ok ?? 0}</span>
                            /{c.filas_total}
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--muted)' }}>—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{estadoBadge(c.estado)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
