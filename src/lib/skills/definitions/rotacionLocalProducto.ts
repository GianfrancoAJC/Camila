import { z } from 'zod';
import type { SkillDefinition } from '../types';
import { resolverProducto, resolverCadenaId, formatPeriodo } from '../helpers';

const schema = z.object({
  producto: z.string().min(2).describe('Nombre (parcial o completo) del producto a consultar.'),
  cadena: z.enum(['BP', 'HYS']).optional().describe('Código de cadena para filtrar.'),
});

export const rotacionLocalProducto: SkillDefinition<z.infer<typeof schema>> = {
  name: 'rotacion_local_producto',
  description: 'Pivote de ventas de los últimos 6 meses de un producto, desglosado por local. Úsala para preguntas sobre qué locales venden más de un producto o su rotación detallada.',
  schema,
  async run({ supabase, empresa_id }, params) {
    const producto = await resolverProducto(supabase, empresa_id, params.producto);
    if (!producto) {
      return { data: null, chartSpec: null, resumenDatos: `No se encontró ningún producto que coincida con "${params.producto}".` };
    }

    const cadenaId = params.cadena ? await resolverCadenaId(supabase, params.cadena) : null;
    let query = supabase.from('v_rotacion_6m').select('*').eq('empresa_id', empresa_id).eq('producto_id', producto.id);
    if (cadenaId) query = query.eq('cadena_id', cadenaId);
    const { data } = await query;
    const filas = data ?? [];

    if (filas.length === 0) {
      return { data: null, chartSpec: null, resumenDatos: `Sin ventas de "${producto.nombre}" en los últimos 6 meses con esos filtros.` };
    }

    const totalPorLocal = new Map<string, number>();
    for (const f of filas) totalPorLocal.set(f.local_nombre, (totalPorLocal.get(f.local_nombre) ?? 0) + Number(f.cantidad));
    const topLocales = Array.from(totalPorLocal.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([nombre]) => nombre);

    const periodos = Array.from(new Set(filas.map((f) => f.periodo))).sort();
    const cols = periodos.map(formatPeriodo);
    const cells: { row: string; col: string; value: number }[] = [];
    for (const local of topLocales) {
      for (const periodo of periodos) {
        const valor = filas
          .filter((f) => f.local_nombre === local && f.periodo === periodo)
          .reduce((s, f) => s + Number(f.cantidad), 0);
        cells.push({ row: local, col: formatPeriodo(periodo), value: valor });
      }
    }

    return {
      data: { topLocales, periodos, cells },
      chartSpec: { type: 'heatmap', rowLabel: 'Local', colLabel: 'Período', rows: topLocales, cols, cells },
      resumenDatos: JSON.stringify({ producto: producto.nombre, locales: topLocales.length, topLocal: topLocales[0] ?? null }),
    };
  },
};
