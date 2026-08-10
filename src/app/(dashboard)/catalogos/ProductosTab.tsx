'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { crearProducto, actualizarProducto } from './actions';

interface Producto {
  id: string;
  nombre: string;
  clasificacion: string;
  activo: boolean;
}

const CLASIFICACIONES = ['A', 'AA', 'B', 'C', 'NE'];

const CLASIF_COLORS: Record<string, { color: string }> = {
  A:  { color: '#22c55e' },
  AA: { color: '#3b82f6' },
  B:  { color: '#f59e0b' },
  C:  { color: '#94a3b8' },
  NE: { color: '#cbd5e1' },
};

function ClasifBadge({ c }: { c: string }) {
  const col = CLASIF_COLORS[c]?.color ?? '#94a3b8';
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ color: col, background: `${col}20` }}
    >
      {c}
    </span>
  );
}

function FilaProducto({ p }: { p: Producto }) {
  const [clasif, setClasif] = useState(p.clasificacion);
  const [activo, setActivo] = useState(p.activo);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClasif(val: string) {
    setClasif(val);
    startTransition(async () => {
      await actualizarProducto(p.id, { clasificacion: val });
      router.refresh();
    });
  }

  function handleToggle() {
    const next = !activo;
    setActivo(next);
    startTransition(async () => {
      await actualizarProducto(p.id, { activo: next });
      router.refresh();
    });
  }

  return (
    <tr
      style={{
        borderTop: '1px solid var(--border)',
        opacity: activo ? 1 : 0.45,
      }}
    >
      <td className="px-4 py-3">
        <span className="text-sm" style={{ color: 'var(--foreground)' }}>
          {p.nombre}
        </span>
      </td>
      <td className="px-4 py-3">
        <select
          value={clasif}
          onChange={(e) => handleClasif(e.target.value)}
          disabled={isPending}
          className="appearance-none rounded-lg border px-2 py-1 text-xs bg-transparent"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
        >
          {CLASIFICACIONES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={handleToggle}
          disabled={isPending}
          className="flex items-center gap-1.5 text-xs transition-opacity disabled:opacity-40"
          style={{ color: activo ? '#22c55e' : 'var(--muted)' }}
        >
          {isPending
            ? <Loader2 size={16} className="animate-spin" />
            : activo
              ? <ToggleRight size={18} />
              : <ToggleLeft size={18} />}
          {activo ? 'Activo' : 'Inactivo'}
        </button>
      </td>
    </tr>
  );
}

function NuevoProductoForm() {
  const [nombre, setNombre] = useState('');
  const [clasif, setClasif] = useState('NE');
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState('');
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    setErr('');
    startTransition(async () => {
      const res = await crearProducto(nombre, clasif);
      if (res?.error) {
        setErr(res.error.includes('unique') ? 'Ya existe un producto con ese nombre' : res.error);
      } else {
        setNombre('');
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3 mb-5">
      <div className="flex-1">
        <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>Nombre del producto</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="NUEVO PRODUCTO 100MG X30CAP"
          className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
        />
        {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
      </div>
      <div>
        <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>Clasificación</label>
        <select
          value={clasif}
          onChange={(e) => setClasif(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm bg-transparent"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
        >
          {CLASIFICACIONES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <button
        type="submit"
        disabled={!nombre.trim() || isPending}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
        style={{ background: 'var(--primary)', color: '#fff' }}
      >
        {isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        Agregar
      </button>
    </form>
  );
}

export function ProductosTab({ productos }: { productos: Producto[] }) {
  return (
    <div>
      <NuevoProductoForm />
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'color-mix(in srgb, var(--border) 30%, transparent)' }}>
              {['Nombre', 'Clasificación', 'Estado'].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: 'var(--muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => <FilaProducto key={p.id} p={p} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
