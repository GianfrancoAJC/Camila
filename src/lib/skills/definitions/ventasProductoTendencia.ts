import { z } from 'zod';
import type { SkillDefinition } from '../types';
import { resolverProducto, resolverCadenaId, obtenerUltimosNPeriodos, formatPeriodo } from '../helpers';

const schema = z.object({
  producto: z.string().min(2).describe('Nombre (parcial o completo) del producto a consultar.'),
  cadena: z.enum(['BP', 'HYS']).optional().describe('Código de cadena para filtrar. Si se omite, se suman ambas.'),
  metrica: z.enum(['unidades', 'valor']).optional().describe('Qué medir en el eje Y: unidades vendidas o valor en soles. Por defecto "valor".'),
  meses: z.number().int().min(1).max(24).optional().describe('Cantidad de meses hacia atrás a graficar. Por defecto 6.'),
});

export const ventasProductoTendencia: SkillDefinition<z.infer<typeof schema>> = {
  name: 'ventas_producto_tendencia',
  description: 'Evolución mensual de ventas de un producto específico (unidades o valor en soles), opcionalmente filtrado por cadena. Úsala para preguntas sobre tendencia o evolución de un producto en el tiempo.',
  schema,
  async run({ supabase, empresa_id }, params) {
    const producto = await resolverProducto(supabase, empresa_id, params.producto);
    if (!producto) {
      return { data: null, chartSpec: null, resumenDatos: `No se encontró ningún producto que coincida con "${params.producto}".` };
    }

    const meses = params.meses ?? 6;
    const periodos = await obtenerUltimosNPeriodos(supabase, empresa_id, meses);
    if (periodos.length === 0) {
      return { data: null, chartSpec: null, resumenDatos: 'No hay períodos con datos cargados.' };
    }

    const cadenaId = params.cadena ? await resolverCadenaId(supabase, params.cadena) : null;
    let query = supabase
      .from('v_ranking_producto')
      .select('*')
      .eq('empresa_id', empresa_id)
      .eq('producto_id', producto.id)
      .gte('periodo', periodos[0])
      .lte('periodo', periodos[periodos.length - 1]);
    if (cadenaId) query = query.eq('cadena_id', cadenaId);
    const { data } = await query;
    const filas = data ?? [];

    const metrica = params.metrica ?? 'valor';
    const porPeriodo = new Map<string, number>();
    for (const p of periodos) porPeriodo.set(p, 0);
    for (const f of filas) {
      const v = metrica === 'valor' ? Number(f.total_neto) : Number(f.total_unidades);
      porPeriodo.set(f.periodo, (porPeriodo.get(f.periodo) ?? 0) + v);
    }

    const chartData = periodos.map((p) => ({ periodo: p, valor: porPeriodo.get(p) ?? 0 }));
    const xLabels = Object.fromEntries(periodos.map((p) => [p, formatPeriodo(p)]));

    return {
      data: chartData,
      chartSpec: {
        type: 'line',
        xKey: 'periodo',
        xLabels,
        series: [{ key: 'valor', label: metrica === 'valor' ? 'Valor S/' : 'Unidades' }],
        data: chartData,
      },
      resumenDatos: JSON.stringify({ producto: producto.nombre, cadena: params.cadena ?? 'ambas', metrica, serie: chartData.map((d) => ({ periodo: formatPeriodo(d.periodo), valor: d.valor })) }),
    };
  },
};
