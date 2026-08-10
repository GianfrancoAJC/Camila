'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

interface Cadena {
  id: string;
  codigo: string;
  nombre: string;
}

export function CadenaFilter({ cadenas, cadenaActiva }: { cadenas: Cadena[]; cadenaActiva: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setCadena(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set('cadena', value);
    else params.delete('cadena');
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="relative">
      <select
        value={cadenaActiva}
        onChange={(e) => setCadena(e.target.value)}
        className="appearance-none rounded-lg border pl-3 pr-8 py-2 text-sm bg-transparent"
        style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
      >
        <option value="">Todas las cadenas</option>
        {cadenas.map((c) => (
          <option key={c.id} value={c.id}>{c.codigo}</option>
        ))}
      </select>
      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--muted)' }} />
    </div>
  );
}
