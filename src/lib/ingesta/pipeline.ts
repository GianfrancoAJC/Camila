import type { SupabaseClient } from '@supabase/supabase-js';
import type { FilaNormalizada } from './parsers';
import { normalizarTexto } from './normalize';

export interface PipelineInput {
  supabase: SupabaseClient;
  empresa_id: string;
  cadena_id: string;
  carga_id: string;
  filas: FilaNormalizada[];
}

export interface PipelineResult {
  filas_ok: number;
  filas_error: number;
  pendientes: number;
}

const CHUNK = 500;

async function upsertChunks(
  supabase: SupabaseClient,
  tabla: string,
  registros: object[],
  onConflict: string
): Promise<number> {
  let ok = 0;
  for (let i = 0; i < registros.length; i += CHUNK) {
    const { error, data } = await supabase
      .from(tabla)
      .upsert(registros.slice(i, i + CHUNK), { onConflict, ignoreDuplicates: false })
      .select('id');
    if (!error) ok += data?.length ?? registros.slice(i, i + CHUNK).length;
  }
  return ok;
}

export async function ejecutarPipeline(input: PipelineInput): Promise<PipelineResult> {
  const { supabase, empresa_id, cadena_id, carga_id, filas } = input;

  // ── 1. Cargar cachés ──────────────────────────────────────────────
  const [mapProdRes, localesRes, ubigeoRes, dimProdRes] = await Promise.all([
    supabase
      .from('map_producto')
      .select('cod_articulo_origen, producto_id')
      .eq('cadena_id', cadena_id),
    supabase
      .from('dim_local')
      .select('id, cod_local, ubigeo_id')
      .eq('cadena_id', cadena_id),
    supabase.from('dim_ubigeo').select('id, departamento, provincia, distrito'),
    supabase
      .from('dim_producto')
      .select('id, nombre')
      .eq('empresa_id', empresa_id),
  ]);

  // cod_articulo → producto_id
  const productoMap = new Map<string, string>();
  for (const p of mapProdRes.data ?? []) {
    productoMap.set(p.cod_articulo_origen, p.producto_id);
  }

  // cod_local → { id, ubigeo_id }
  const localMap = new Map<string, { id: string; ubigeo_id: string | null }>();
  for (const l of localesRes.data ?? []) {
    localMap.set(l.cod_local, { id: l.id, ubigeo_id: l.ubigeo_id });
  }

  // "DEPT|DIST" → ubigeo_id
  const ubigeoMap = new Map<string, string>();
  for (const u of ubigeoRes.data ?? []) {
    ubigeoMap.set(`${u.departamento}|${u.distrito}`, u.id);
  }

  // nombre_normalizado → producto_id (fallback auto-mapping)
  const dimProdNombreMap = new Map<string, string>();
  for (const p of dimProdRes.data ?? []) {
    dimProdNombreMap.set(normalizarTexto(p.nombre), p.id);
  }

  // ── 2. Descubrir locales nuevos y crearlos ────────────────────────
  const nuevosLocales = new Map<string, FilaNormalizada>();
  for (const fila of filas) {
    if (fila.cod_local && !localMap.has(fila.cod_local) && !nuevosLocales.has(fila.cod_local)) {
      nuevosLocales.set(fila.cod_local, fila);
    }
  }

  if (nuevosLocales.size > 0) {
    const records = Array.from(nuevosLocales.entries()).map(([cod_local, f]) => ({
      empresa_id,
      cadena_id,
      cod_local,
      nombre: f.nombre_local || cod_local,
      direccion: f.direccion || null,
      ubigeo_id: f.departamento && f.distrito
        ? (ubigeoMap.get(`${f.departamento}|${f.distrito}`) ?? null)
        : null,
      tipo: 'LOCAL' as const,
      estado: 'ACTIVO' as const,
    }));

    for (let i = 0; i < records.length; i += CHUNK) {
      const { data } = await supabase
        .from('dim_local')
        .insert(records.slice(i, i + CHUNK))
        .select('id, cod_local, ubigeo_id');
      for (const l of data ?? []) {
        localMap.set(l.cod_local, { id: l.id, ubigeo_id: l.ubigeo_id });
      }
    }
  }

  // ── 3. Auto-mapear productos por nombre (si no están en map_producto) ──
  // Recopilamos códigos sin mapeo y buscamos por nombre normalizado en dim_producto
  const nuevosMapProducto: object[] = [];
  const codigosVistos = new Set<string>();

  for (const fila of filas) {
    if (productoMap.has(fila.cod_producto) || codigosVistos.has(fila.cod_producto)) continue;
    codigosVistos.add(fila.cod_producto);

    const nombreNorm = normalizarTexto(fila.nombre_producto);
    const productoId = dimProdNombreMap.get(nombreNorm);
    if (productoId) {
      productoMap.set(fila.cod_producto, productoId);
      nuevosMapProducto.push({
        empresa_id,
        cadena_id,
        cod_articulo_origen: fila.cod_producto,
        nombre_origen: fila.nombre_producto,
        producto_id: productoId,
      });
    }
  }

  if (nuevosMapProducto.length > 0) {
    await supabase
      .from('map_producto')
      .upsert(nuevosMapProducto, { onConflict: 'cadena_id,cod_articulo_origen', ignoreDuplicates: true });
  }

  // ── 4. Clasificar filas: hechos vs pendientes ─────────────────────
  const hechos: object[] = [];
  const pendientesMap = new Map<string, object>(); // valor_origen → pendiente
  let filas_error = 0;

  for (const fila of filas) {
    const local = localMap.get(fila.cod_local);
    if (!local) { filas_error++; continue; }

    const producto_id = productoMap.get(fila.cod_producto);
    const periodo = `${fila.anio}-${String(fila.mes).padStart(2, '0')}-01`;

    if (producto_id) {
      hechos.push({
        empresa_id,
        cadena_id,
        local_id: local.id,
        producto_id,
        anio: fila.anio,
        mes: fila.mes,
        periodo,
        cantidad: fila.cantidad,
        neto_vta: fila.neto_vta,
        stock: fila.stock,
        carga_id,
      });
    } else {
      filas_error++;
      if (!pendientesMap.has(fila.cod_producto)) {
        pendientesMap.set(fila.cod_producto, {
          empresa_id,
          carga_id,
          cadena_id,
          tipo: 'producto',
          valor_origen: fila.cod_producto,
          fila_json: {
            cod_producto: fila.cod_producto,
            nombre_producto: fila.nombre_producto,
            cod_local: fila.cod_local,
            nombre_local: fila.nombre_local,
          },
          estado: 'pendiente',
        });
      }
    }
  }

  // ── 5. Escritura en lote ──────────────────────────────────────────
  const filas_ok = await upsertChunks(
    supabase,
    'fact_venta_stock',
    hechos,
    'cadena_id,local_id,producto_id,periodo'
  );

  const pendientesArr = Array.from(pendientesMap.values());
  if (pendientesArr.length > 0) {
    await supabase.from('pendientes_mapeo').insert(pendientesArr);
  }

  return { filas_ok, filas_error, pendientes: pendientesArr.length };
}
