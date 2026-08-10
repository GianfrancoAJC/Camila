import type { SupabaseClient } from '@supabase/supabase-js';

export interface ProductoResuelto {
  id: string;
  nombre: string;
  clasificacion: string;
}

/** Busca un producto por coincidencia parcial de nombre (case-insensitive). */
export async function resolverProducto(
  supabase: SupabaseClient,
  empresa_id: string,
  nombre: string
): Promise<ProductoResuelto | null> {
  const term = nombre.trim();
  if (!term) return null;

  const { data } = await supabase
    .from('dim_producto')
    .select('id, nombre, clasificacion')
    .eq('empresa_id', empresa_id)
    .eq('activo', true)
    .ilike('nombre', `%${term}%`)
    .order('nombre', { ascending: true })
    .limit(10);

  if (!data || data.length === 0) return null;
  // Prioriza el nombre más corto (probable match más exacto) entre los candidatos.
  return [...data].sort((a, b) => a.nombre.length - b.nombre.length)[0];
}

/** Resuelve el id de dim_cadena a partir de su código (BP/HYS). */
export async function resolverCadenaId(
  supabase: SupabaseClient,
  codigo: string
): Promise<string | null> {
  const { data } = await supabase
    .from('dim_cadena')
    .select('id')
    .eq('codigo', codigo.toUpperCase())
    .maybeSingle();
  return data?.id ?? null;
}

/** Período más reciente con datos cargados (formato YYYY-MM-01). */
export async function obtenerPeriodoReciente(
  supabase: SupabaseClient,
  empresa_id: string
): Promise<string | null> {
  const { data } = await supabase
    .from('v_periodos_disponibles')
    .select('periodo')
    .eq('empresa_id', empresa_id)
    .order('periodo', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.periodo ?? null;
}

/** Últimos N períodos con datos, en orden ascendente. */
export async function obtenerUltimosNPeriodos(
  supabase: SupabaseClient,
  empresa_id: string,
  n: number
): Promise<string[]> {
  const { data } = await supabase
    .from('v_periodos_disponibles')
    .select('periodo')
    .eq('empresa_id', empresa_id)
    .order('periodo', { ascending: false })
    .limit(n);
  return (data ?? []).map((r) => r.periodo).reverse();
}

export function formatSoles(n: number): string {
  return `S/ ${n.toLocaleString('es-PE', { maximumFractionDigits: 0 })}`;
}

export function formatUnidades(n: number): string {
  return n.toLocaleString('es-PE', { maximumFractionDigits: 0 });
}

export function formatPeriodo(p: string): string {
  const [anio, mes] = p.split('-');
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${meses[parseInt(mes, 10) - 1] ?? mes} ${anio}`;
}
