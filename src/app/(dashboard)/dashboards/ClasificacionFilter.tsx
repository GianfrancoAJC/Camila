'use client';

import { ChevronDown } from 'lucide-react';

const CLASIFICACIONES = ['A', 'AA', 'B', 'C', 'NE'];

export function ClasificacionFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-lg border pl-3 pr-8 py-1.5 text-xs bg-transparent"
        style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
      >
        <option value="">Todas las clasificaciones</option>
        {CLASIFICACIONES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--muted)' }} />
    </div>
  );
}
