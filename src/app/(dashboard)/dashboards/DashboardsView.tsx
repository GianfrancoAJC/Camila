'use client';

import { useState } from 'react';
import { BarChart3, TrendingUp, Map } from 'lucide-react';
import { CadenaFilter } from './CadenaFilter';
import { RangoFilter } from './RangoFilter';
import { ProductoFilter } from './ProductoFilter';
import { RankingChart } from './RankingChart';
import { RotacionChart } from './RotacionChart';
import { PeruMap } from './PeruMap';

// 'cobertura' (Alertas de stock) se oculta temporalmente a pedido del usuario.
// El componente CoberturaTable y la query en page.tsx se mantienen intactos.
const TABS = [
  { id: 'ranking', label: 'Ranking', icon: BarChart3 },
  { id: 'rotacion', label: 'Rotación', icon: TrendingUp },
  { id: 'zonificacion', label: 'Zonificación', icon: Map },
] as const;

type Tab = (typeof TABS)[number]['id'];

export function DashboardsView({
  cadenas,
  periodos,
  productos,
  cadenaActiva,
  rRange,
  tRange,
  zRange,
  productoActivo,
  productoActivoZona,
  ranking,
  tendencia,
  serieProducto,
  topProductosRango,
  zonificacion,
}: {
  cadenas: { id: string; codigo: string; nombre: string }[];
  periodos: string[];
  productos: { id: string; nombre: string }[];
  cadenaActiva: string;
  rRange: { desde: string; hasta: string };
  tRange: { desde: string; hasta: string };
  zRange: { desde: string; hasta: string };
  productoActivo: string;
  productoActivoZona: string;
  ranking: any[];
  tendencia: any[];
  serieProducto: any[];
  topProductosRango: any[];
  zonificacion: any[];
}) {
  const [tab, setTab] = useState<Tab>('ranking');

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <CadenaFilter cadenas={cadenas} cadenaActiva={cadenaActiva} />
      </div>

      <div className="flex items-center gap-1 mb-4 border-b" style={{ borderColor: 'var(--border)' }}>
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
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
            </button>
          );
        })}
      </div>

      {tab === 'ranking' && (
        <div>
          <div className="mb-4">
            <RangoFilter prefix="r" periodos={periodos} desde={rRange.desde} hasta={rRange.hasta} />
          </div>
          <RankingChart ranking={ranking} />
        </div>
      )}

      {tab === 'rotacion' && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <RangoFilter prefix="t" periodos={periodos} desde={tRange.desde} hasta={tRange.hasta} />
            <ProductoFilter productos={productos} productoActivo={productoActivo} />
          </div>
          <RotacionChart
            tendencia={tendencia}
            serieProducto={serieProducto}
            topProductosRango={topProductosRango}
            productoActivo={productoActivo}
          />
        </div>
      )}

      {tab === 'zonificacion' && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <RangoFilter prefix="z" periodos={periodos} desde={zRange.desde} hasta={zRange.hasta} />
            <ProductoFilter
              productos={productos}
              productoActivo={productoActivoZona}
              paramName="z_producto"
              todosLabel="Todos los productos (por clasificación)"
            />
          </div>
          <PeruMap
            datos={zonificacion}
            productoNombre={productos.find((p) => p.id === productoActivoZona)?.nombre ?? ''}
          />
        </div>
      )}
    </div>
  );
}
