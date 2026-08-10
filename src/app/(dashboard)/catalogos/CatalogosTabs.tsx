'use client';

import { useState } from 'react';
import { AlertTriangle, Package, MapPin } from 'lucide-react';
import { PendientesTab } from './PendientesTab';
import { ProductosTab } from './ProductosTab';
import { LocalesTab } from './LocalesTab';

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
  activo: boolean;
}

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

const TABS = [
  { id: 'pendientes', label: 'Pendientes', icon: AlertTriangle },
  { id: 'productos', label: 'Productos', icon: Package },
  { id: 'locales', label: 'Locales', icon: MapPin },
] as const;

type Tab = (typeof TABS)[number]['id'];

export function CatalogosTabs({
  pendientes,
  productos,
  locales,
}: {
  pendientes: Pendiente[];
  productos: Producto[];
  locales: Local[];
}) {
  const [tab, setTab] = useState<Tab>('pendientes');

  return (
    <div>
      <div className="flex items-center gap-1 mb-6 border-b" style={{ borderColor: 'var(--border)' }}>
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          const count = id === 'pendientes' ? pendientes.length : null;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px border-b-2"
              style={{
                color: active ? 'var(--primary)' : 'var(--muted)',
                borderColor: active ? 'var(--primary)' : 'transparent',
              }}
            >
              <Icon size={14} />
              {label}
              {count !== null && count > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: '#ef4444', color: '#fff' }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === 'pendientes' && <PendientesTab pendientes={pendientes} productos={productos} />}
      {tab === 'productos' && <ProductosTab productos={productos} />}
      {tab === 'locales' && <LocalesTab locales={locales} />}
    </div>
  );
}
