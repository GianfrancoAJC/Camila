'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

interface Producto {
  id: string;
  nombre: string;
}

export function ProductoFilter({
  productos,
  productoActivo,
  paramName = 't_producto',
  todosLabel = 'Totales (todos los productos)',
}: {
  productos: Producto[];
  productoActivo: string;
  paramName?: string;
  todosLabel?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setProducto(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(paramName, value);
    else params.delete(paramName);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="relative">
      <select
        value={productoActivo}
        onChange={(e) => setProducto(e.target.value)}
        className="appearance-none rounded-lg border pl-3 pr-8 py-1.5 text-xs bg-transparent max-w-[240px]"
        style={{ borderColor: 'var(--border)', color: productoActivo ? 'var(--foreground)' : 'var(--muted)' }}
      >
        <option value="">{todosLabel}</option>
        {productos.map((p) => (
          <option key={p.id} value={p.id}>{p.nombre}</option>
        ))}
      </select>
      <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--muted)' }} />
    </div>
  );
}
