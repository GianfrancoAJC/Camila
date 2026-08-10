'use client';

export type Metrica = 'unidades' | 'valor';

export function MetricToggle({ value, onChange }: { value: Metrica; onChange: (m: Metrica) => void }) {
  const opciones: { id: Metrica; label: string }[] = [
    { id: 'unidades', label: 'Unidades' },
    { id: 'valor', label: 'Valor S/' },
  ];

  return (
    <div
      className="inline-flex rounded-lg border p-0.5"
      style={{ borderColor: 'var(--border)' }}
    >
      {opciones.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className="px-3 py-1 rounded-md text-xs font-medium transition-colors"
            style={{
              background: active ? 'var(--primary)' : 'transparent',
              color: active ? '#fff' : 'var(--muted)',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
