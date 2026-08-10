'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, X, Loader2, ChevronDown } from 'lucide-react';
import { resolverPendiente, descartarPendiente } from './actions';

interface Pendiente {
  id: string;
  cadena_id: string;
  valor_origen: string;
  fila_json: Record<string, string>;
  dim_cadena: { codigo: string } | null;
}

interface Producto {
  id: string;
  nombre: string;
  clasificacion: string;
}

function ClasifBadge({ c }: { c: string }) {
  const colors: Record<string, string> = {
    A: '#22c55e', AA: '#3b82f6', B: '#f59e0b', C: '#94a3b8', NE: '#e2e8f0',
  };
  return (
    <span
      className="text-xs font-bold px-1.5 py-0.5 rounded"
      style={{ color: colors[c] ?? '#94a3b8', background: `${colors[c] ?? '#94a3b8'}20` }}
    >
      {c}
    </span>
  );
}

function FilaPendiente({
  p,
  productos,
}: {
  p: Pendiente;
  productos: Producto[];
}) {
  const [productoId, setProductoId] = useState('');
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const router = useRouter();

  if (done) return null;

  async function handleResolver() {
    if (!productoId) return;
    setErr('');
    startTransition(async () => {
      const res = await resolverPendiente(p.id, productoId);
      if (res?.error) {
        setErr(res.error);
      } else {
        setDone(true);
        router.refresh();
      }
    });
  }

  async function handleDescartar() {
    startTransition(async () => {
      await descartarPendiente(p.id);
      setDone(true);
      router.refresh();
    });
  }

  const cadena = p.dim_cadena?.codigo ?? '—';
  const nombreCSV = p.fila_json?.nombre_producto ?? '';

  return (
    <tr style={{ borderTop: '1px solid var(--border)' }}>
      <td className="px-4 py-3">
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ color: 'var(--primary)', background: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}
        >
          {cadena}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs font-mono" style={{ color: 'var(--foreground)' }}>
          {p.valor_origen}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs" style={{ color: 'var(--muted)' }}>
          {nombreCSV}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="relative">
          <select
            value={productoId}
            onChange={(e) => setProductoId(e.target.value)}
            className="w-full appearance-none rounded-lg border px-3 py-1.5 text-xs pr-8 bg-transparent"
            style={{ borderColor: 'var(--border)', color: productoId ? 'var(--foreground)' : 'var(--muted)' }}
          >
            <option value="">— Seleccionar producto —</option>
            {productos.map((prod) => (
              <option key={prod.id} value={prod.id}>
                [{prod.clasificacion}] {prod.nombre}
              </option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--muted)' }} />
        </div>
        {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleResolver}
            disabled={!productoId || isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity disabled:opacity-40"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            {isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
            Resolver
          </button>
          <button
            onClick={handleDescartar}
            disabled={isPending}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-40"
            style={{ color: 'var(--muted)' }}
          >
            <X size={12} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function PendientesTab({
  pendientes,
  productos,
}: {
  pendientes: Pendiente[];
  productos: Producto[];
}) {
  if (pendientes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <CheckCircle size={32} className="text-green-500" />
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Sin pendientes. Todos los códigos están mapeados.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
        Asigna cada código de la cadena al producto canónico de AJR. El mapeo se guarda y la próxima carga lo reutiliza automáticamente.
      </p>
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'color-mix(in srgb, var(--border) 30%, transparent)' }}>
              {['Cadena', 'Código CSV', 'Nombre en CSV', 'Producto AJR', 'Acción'].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: 'var(--muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pendientes.map((p) => (
              <FilaPendiente key={p.id} p={p} productos={productos} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
