'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

function formatPeriodo(p: string) {
  const [anio, mes] = p.split('-');
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${meses[parseInt(mes, 10) - 1] ?? mes} ${anio}`;
}

export function RangoFilter({
  prefix,
  periodos,
  desde,
  hasta,
}: {
  prefix: string;
  periodos: string[]; // descendente
  desde: string;
  hasta: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const periodosAsc = [...periodos].reverse();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  if (periodos.length === 0) {
    return <span className="text-xs" style={{ color: 'var(--muted)' }}>Sin períodos cargados aún</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs" style={{ color: 'var(--muted)' }}>Desde</span>
      <div className="relative">
        <select
          value={desde}
          onChange={(e) => setParam(`${prefix}_desde`, e.target.value)}
          className="appearance-none rounded-lg border pl-3 pr-7 py-1.5 text-xs bg-transparent"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
        >
          {periodosAsc.map((p) => (
            <option key={p} value={p}>{formatPeriodo(p)}</option>
          ))}
        </select>
        <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--muted)' }} />
      </div>
      <span className="text-xs" style={{ color: 'var(--muted)' }}>Hasta</span>
      <div className="relative">
        <select
          value={hasta}
          onChange={(e) => setParam(`${prefix}_hasta`, e.target.value)}
          className="appearance-none rounded-lg border pl-3 pr-7 py-1.5 text-xs bg-transparent"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
        >
          {periodos.map((p) => (
            <option key={p} value={p}>{formatPeriodo(p)}</option>
          ))}
        </select>
        <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--muted)' }} />
      </div>
    </div>
  );
}
