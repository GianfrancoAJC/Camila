'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { actualizarLocal } from './actions';

interface Local {
  id: string;
  cod_local: string;
  nombre: string;
  direccion: string | null;
  tipo: string;
  estado: string;
  dim_cadena: { codigo: string } | null;
  dim_ubigeo: { departamento: string; distrito: string } | null;
}

function FilaLocal({ l }: { l: Local }) {
  const [tipo, setTipo] = useState(l.tipo);
  const [estado, setEstado] = useState(l.estado);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function update(campos: { tipo?: string; estado?: string }) {
    startTransition(async () => {
      await actualizarLocal(l.id, campos);
      router.refresh();
    });
  }

  const cadena = (l.dim_cadena as unknown as { codigo: string } | null)?.codigo ?? '—';
  const geo = (l.dim_ubigeo as unknown as { departamento: string; distrito: string } | null);

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
        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{l.nombre}</p>
        <p className="text-xs font-mono" style={{ color: 'var(--muted)' }}>{l.cod_local}</p>
      </td>
      <td className="px-4 py-3">
        {geo ? (
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {geo.distrito}, {geo.departamento}
          </p>
        ) : (
          <span className="text-xs" style={{ color: 'var(--muted)' }}>—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <select
          value={tipo}
          onChange={(e) => { setTipo(e.target.value); update({ tipo: e.target.value }); }}
          disabled={isPending}
          className="appearance-none rounded-lg border px-2 py-1 text-xs bg-transparent"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
        >
          <option value="LOCAL">LOCAL</option>
          <option value="ALMACEN">ALMACÉN</option>
        </select>
      </td>
      <td className="px-4 py-3">
        <select
          value={estado}
          onChange={(e) => { setEstado(e.target.value); update({ estado: e.target.value }); }}
          disabled={isPending}
          className="appearance-none rounded-lg border px-2 py-1 text-xs bg-transparent"
          style={{ borderColor: 'var(--border)', color: estado === 'ACTIVO' ? '#22c55e' : '#94a3b8' }}
        >
          <option value="ACTIVO">ACTIVO</option>
          <option value="INACTIVO">INACTIVO</option>
        </select>
      </td>
      <td className="px-4 py-3">
        {isPending && <Loader2 size={14} className="animate-spin" style={{ color: 'var(--muted)' }} />}
      </td>
    </tr>
  );
}

export function LocalesTab({ locales }: { locales: Local[] }) {
  const [busqueda, setBusqueda] = useState('');

  const filtrados = locales.filter(
    (l) =>
      l.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      l.cod_local.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div>
      <div className="mb-4">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o código…"
          className="w-full max-w-sm rounded-lg border px-3 py-2 text-sm bg-transparent"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
        />
      </div>
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'color-mix(in srgb, var(--border) 30%, transparent)' }}>
              {['Cadena', 'Local', 'Ubicación', 'Tipo', 'Estado', ''].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: 'var(--muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--muted)' }}>
                  {busqueda ? 'Sin resultados para esa búsqueda' : 'Sin locales registrados aún'}
                </td>
              </tr>
            ) : (
              filtrados.map((l) => <FilaLocal key={l.id} l={l} />)
            )}
          </tbody>
        </table>
      </div>
      {filtrados.length > 0 && (
        <p className="text-xs mt-3" style={{ color: 'var(--muted)' }}>
          {filtrados.length} local{filtrados.length !== 1 ? 'es' : ''}
          {busqueda ? ` · mostrando resultados para "${busqueda}"` : ''}
        </p>
      )}
    </div>
  );
}
