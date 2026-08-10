import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { DashboardsView } from './DashboardsView';

interface SearchParams {
  cadena?: string;
  r_desde?: string;
  r_hasta?: string;
  t_desde?: string;
  t_hasta?: string;
  t_producto?: string;
  z_desde?: string;
  z_hasta?: string;
  z_producto?: string;
}

function clampRange(periodosAsc: string[], desde: string | undefined, hasta: string | undefined, fallbackMeses: number) {
  if (periodosAsc.length === 0) return { desde: '', hasta: '' };
  const valido = (p?: string) => !!p && periodosAsc.includes(p);
  const hi = valido(hasta) ? hasta! : periodosAsc[periodosAsc.length - 1];
  const lo = valido(desde) ? desde! : periodosAsc[Math.max(0, periodosAsc.length - fallbackMeses)];
  return lo <= hi ? { desde: lo, hasta: hi } : { desde: hi, hasta: lo };
}

export default async function DashboardsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { cadena, r_desde, r_hasta, t_desde, t_hasta, t_producto, z_desde, z_hasta, z_producto } = await searchParams;
  const supabase = await createClient();

  const [{ data: cadenas }, { data: periodosRaw }, { data: productos }] = await Promise.all([
    supabase.from('dim_cadena').select('id, codigo, nombre').order('codigo'),
    supabase.from('v_periodos_disponibles').select('periodo').order('periodo', { ascending: false }).limit(24),
    supabase.from('dim_producto').select('id, nombre').eq('activo', true).order('nombre'),
  ]);

  const periodos = (periodosRaw ?? []).map((r) => r.periodo); // desc
  const periodosAsc = [...periodos].reverse();
  const cadenaActiva = cadena && cadenas?.some((c) => c.id === cadena) ? cadena : '';

  const rRange = clampRange(periodosAsc, r_desde, r_hasta, 1);
  const tRange = clampRange(periodosAsc, t_desde, t_hasta, 6);
  const zRange = clampRange(periodosAsc, z_desde, z_hasta, 1);
  const productoActivo = t_producto && productos?.some((p) => p.id === t_producto) ? t_producto : '';
  const productoActivoZona = z_producto && productos?.some((p) => p.id === z_producto) ? z_producto : '';

  // ── Ranking: producto x cadena x período, agregado en el cliente sobre el rango ──
  let rankingQuery = supabase.from('v_ranking_producto').select('*');
  if (rRange.desde) rankingQuery = rankingQuery.gte('periodo', rRange.desde).lte('periodo', rRange.hasta);
  if (cadenaActiva) rankingQuery = rankingQuery.eq('cadena_id', cadenaActiva);
  const { data: ranking } = await rankingQuery;

  // ── Rotación ──
  let tendencia: any[] = [];
  let serieProducto: any[] = [];
  let topProductosRango: any[] = [];

  if (productoActivo) {
    let serieQuery = supabase.from('v_ranking_producto').select('*').eq('producto_id', productoActivo).order('periodo', { ascending: true });
    if (tRange.desde) serieQuery = serieQuery.gte('periodo', tRange.desde).lte('periodo', tRange.hasta);
    if (cadenaActiva) serieQuery = serieQuery.eq('cadena_id', cadenaActiva);
    const { data } = await serieQuery;
    serieProducto = data ?? [];
  } else {
    let tendenciaQuery = supabase.from('v_rotacion_tendencia').select('*').order('periodo', { ascending: true });
    if (tRange.desde) tendenciaQuery = tendenciaQuery.gte('periodo', tRange.desde).lte('periodo', tRange.hasta);
    if (cadenaActiva) tendenciaQuery = tendenciaQuery.eq('cadena_id', cadenaActiva);
    const { data: t } = await tendenciaQuery;
    tendencia = t ?? [];

    let topQuery = supabase.from('v_ranking_producto').select('*');
    if (tRange.desde) topQuery = topQuery.gte('periodo', tRange.desde).lte('periodo', tRange.hasta);
    if (cadenaActiva) topQuery = topQuery.eq('cadena_id', cadenaActiva);
    const { data: top } = await topQuery;
    topProductosRango = top ?? [];
  }

  // ── Zonificación: departamento x provincia x clasificación, agregado en el cliente.
  // Con producto específico, usa v_ranking (mismo grano + producto_id) en vez de la
  // vista agregada por clasificación.
  let zonaQuery = productoActivoZona
    ? supabase.from('v_ranking').select('*').eq('producto_id', productoActivoZona)
    : supabase.from('v_zonificacion').select('*');
  if (zRange.desde) zonaQuery = zonaQuery.gte('periodo', zRange.desde).lte('periodo', zRange.hasta);
  if (cadenaActiva) zonaQuery = zonaQuery.eq('cadena_id', cadenaActiva);
  const { data: zonificacion } = await zonaQuery;

  // Alertas de stock (v_cobertura): tab oculto temporalmente a pedido del usuario.
  // CoberturaTable.tsx se conserva intacto para reactivarlo cuando se decida.

  return (
    <div className="px-6 py-8 max-w-6xl">
      <PageHeader title="Dashboards" description="Tableros curados de sell-out, stock y cobertura" />

      <DashboardsView
        cadenas={cadenas ?? []}
        periodos={periodos}
        productos={productos ?? []}
        cadenaActiva={cadenaActiva}
        rRange={rRange}
        tRange={tRange}
        zRange={zRange}
        productoActivo={productoActivo}
        productoActivoZona={productoActivoZona}
        ranking={ranking ?? []}
        tendencia={tendencia}
        serieProducto={serieProducto}
        topProductosRango={topProductosRango}
        zonificacion={zonificacion ?? []}
      />
    </div>
  );
}
