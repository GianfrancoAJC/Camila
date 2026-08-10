'use client';

import { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { ArrowLeft } from 'lucide-react';
import { MetricToggle, type Metrica } from './MetricToggle';
import { ClasificacionFilter } from './ClasificacionFilter';

const DEPT_GEO = '/geo/peru_departamental.geojson';
const PROV_GEO = '/geo/peru_provincial.geojson';
const DIST_GEO = '/geo/peru_distrital.geojson';

interface FilaZona {
  departamento: string;
  provincia: string;
  distrito?: string;
  clasificacion: string;
  total_unidades: number;
  total_neto: number;
}

interface Agregado {
  unidades: number;
  neto: number;
  porClasif: Record<string, { unidades: number; neto: number }>;
}

const CLASIF_COLOR: Record<string, string> = {
  A: '#22c55e', AA: '#3b82f6', B: '#f59e0b', C: '#94a3b8', NE: '#cbd5e1',
};

function formatSoles(n: number) {
  return `S/ ${n.toLocaleString('es-PE', { maximumFractionDigits: 0 })}`;
}

function formatUnidades(n: number) {
  return n.toLocaleString('es-PE', { maximumFractionDigits: 0 });
}

function colorEscala(t: number) {
  const start = [224, 231, 255];
  const end = [55, 48, 163];
  const rgb = start.map((s, i) => Math.round(s + (end[i] - s) * Math.min(1, Math.max(0, t))));
  return `rgb(${rgb.join(',')})`;
}

function agregar(filas: FilaZona[], llave: 'departamento' | 'provincia' | 'distrito'): Map<string, Agregado> {
  const map = new Map<string, Agregado>();
  for (const f of filas) {
    const key = f[llave];
    if (!key) continue;
    const cur = map.get(key) ?? { unidades: 0, neto: 0, porClasif: {} };
    cur.unidades += Number(f.total_unidades);
    cur.neto += Number(f.total_neto);
    const pc = cur.porClasif[f.clasificacion] ?? { unidades: 0, neto: 0 };
    pc.unidades += Number(f.total_unidades);
    pc.neto += Number(f.total_neto);
    cur.porClasif[f.clasificacion] = pc;
    map.set(key, cur);
  }
  return map;
}

export function PeruMap({ datos, productoNombre }: { datos: FilaZona[]; productoNombre?: string }) {
  const [metrica, setMetrica] = useState<Metrica>('valor');
  const [clasifFiltro, setClasifFiltro] = useState('');
  const [deptoSel, setDeptoSel] = useState('');
  const [provinciaSel, setProvinciaSel] = useState('');
  const [hover, setHover] = useState<{ nombre: string; x: number; y: number; agg: Agregado | null } | null>(null);
  const modoProducto = !!productoNombre;

  const datosFiltrados = useMemo(
    () => (!modoProducto && clasifFiltro ? datos.filter((d) => d.clasificacion === clasifFiltro) : datos),
    [datos, clasifFiltro, modoProducto]
  );

  const porDepto = useMemo(() => agregar(datosFiltrados, 'departamento'), [datosFiltrados]);
  const porProvincia = useMemo(
    () => agregar(datosFiltrados.filter((d) => d.departamento === deptoSel), 'provincia'),
    [datosFiltrados, deptoSel]
  );
  const porDistrito = useMemo(
    () => agregar(datosFiltrados.filter((d) => d.departamento === deptoSel && d.provincia === provinciaSel), 'distrito'),
    [datosFiltrados, deptoSel, provinciaSel]
  );

  const nivel = provinciaSel ? 'distrito' : deptoSel ? 'provincia' : 'departamento';
  const mapaActivo = nivel === 'distrito' ? porDistrito : nivel === 'provincia' ? porProvincia : porDepto;
  const geoSrc = nivel === 'distrito' ? DIST_GEO : nivel === 'provincia' ? PROV_GEO : DEPT_GEO;

  const maxValor = useMemo(() => {
    let max = 0;
    for (const v of mapaActivo.values()) max = Math.max(max, metrica === 'valor' ? v.neto : v.unidades);
    return max || 1;
  }, [mapaActivo, metrica]);

  function handleClick(nombre: string) {
    if (nivel === 'departamento') setDeptoSel(nombre);
    else if (nivel === 'provincia') setProvinciaSel(nombre);
    // a nivel distrito no hay más drill-down
  }

  function volver() {
    if (nivel === 'distrito') setProvinciaSel('');
    else if (nivel === 'provincia') setDeptoSel('');
  }

  if (datos.length === 0) {
    return (
      <div className="rounded-xl border p-8 text-center text-sm" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
        Sin datos geográficos para este filtro
      </div>
    );
  }

  const titulo = nivel === 'distrito' ? `${deptoSel} — ${provinciaSel}` : nivel === 'provincia' ? deptoSel : 'Perú — por departamento';
  const volverLabel = nivel === 'distrito' ? `Volver a ${deptoSel}` : 'Volver a Perú';

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          {nivel !== 'departamento' && (
            <button
              onClick={volver}
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border"
              style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}
            >
              <ArrowLeft size={12} />
              {volverLabel}
            </button>
          )}
          <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            {titulo}
          </span>
          {modoProducto ? (
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ color: 'var(--primary)', background: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}
            >
              {productoNombre}
            </span>
          ) : (
            <ClasificacionFilter value={clasifFiltro} onChange={setClasifFiltro} />
          )}
        </div>
        <MetricToggle value={metrica} onChange={setMetrica} />
      </div>

      <div className="rounded-xl border p-2 relative" style={{ borderColor: 'var(--border)' }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [-75.5, -9.3], scale: 1500 }}
          width={700}
          height={520}
          style={{ width: '100%', height: 'auto' }}
        >
          <Geographies geography={geoSrc}>
            {({ geographies }) =>
              geographies
                .filter((geo) => {
                  if (nivel === 'departamento') return true;
                  if (nivel === 'provincia') return geo.properties.FIRST_NOMB === deptoSel;
                  return geo.properties.NOMBDEP === deptoSel && geo.properties.NOMBPROV === provinciaSel;
                })
                .map((geo) => {
                  const nombre =
                    nivel === 'departamento' ? geo.properties.NOMBDEP :
                    nivel === 'provincia' ? geo.properties.NOMBPROV :
                    geo.properties.NOMBDIST;
                  const agg = mapaActivo.get(nombre) ?? null;
                  const valor = agg ? (metrica === 'valor' ? agg.neto : agg.unidades) : 0;
                  const fill = agg ? colorEscala(valor / maxValor) : '#f1f5f9';
                  const clickable = nivel !== 'distrito';
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => { if (clickable) handleClick(nombre); }}
                      onMouseEnter={(evt) => setHover({ nombre, x: evt.clientX, y: evt.clientY, agg })}
                      onMouseMove={(evt) => setHover((h) => (h ? { ...h, x: evt.clientX, y: evt.clientY } : h))}
                      onMouseLeave={() => setHover(null)}
                      style={{
                        default: { fill, stroke: '#fff', strokeWidth: 0.6, outline: 'none', cursor: clickable ? 'pointer' : 'default' },
                        hover: { fill, stroke: 'var(--primary)', strokeWidth: 1.2, outline: 'none', cursor: clickable ? 'pointer' : 'default' },
                        pressed: { fill, outline: 'none' },
                      }}
                    />
                  );
                })
            }
          </Geographies>
        </ComposableMap>

        {hover && (
          <div
            className="fixed z-50 rounded-lg border px-3 py-2 text-xs shadow-lg pointer-events-none"
            style={{
              left: hover.x + 12,
              top: hover.y + 12,
              background: 'var(--background)',
              borderColor: 'var(--border)',
              minWidth: 160,
            }}
          >
            <p className="font-medium mb-1" style={{ color: 'var(--foreground)' }}>{hover.nombre}</p>
            {hover.agg ? (
              <>
                <p style={{ color: 'var(--muted)' }}>
                  {formatSoles(hover.agg.neto)} · {formatUnidades(hover.agg.unidades)} u.
                </p>
                <div className="mt-1.5 space-y-0.5">
                  {Object.entries(hover.agg.porClasif)
                    .sort((a, b) => b[1].neto - a[1].neto)
                    .map(([c, v]) => (
                      <div key={c} className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full" style={{ background: CLASIF_COLOR[c] ?? '#94a3b8' }} />
                          <span style={{ color: 'var(--muted)' }}>{c}</span>
                        </span>
                        <span style={{ color: 'var(--foreground)' }}>
                          {((metrica === 'valor' ? v.neto : v.unidades) / (metrica === 'valor' ? hover.agg!.neto : hover.agg!.unidades) * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--muted)' }}>Sin ventas registradas</p>
            )}
          </div>
        )}
      </div>

      <p className="text-xs mt-3" style={{ color: 'var(--muted)' }}>
        {nivel === 'departamento' && 'Click en un departamento para ver el detalle por provincia. '}
        {nivel === 'provincia' && 'Click en una provincia para ver el detalle por distrito. '}
        {nivel === 'distrito' && 'Detalle por distrito. '}
        Color más oscuro = mayor {metrica === 'valor' ? 'venta en S/' : 'unidades vendidas'}.
      </p>
    </div>
  );
}
