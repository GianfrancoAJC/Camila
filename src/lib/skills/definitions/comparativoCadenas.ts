import { z } from 'zod';
import type { SkillDefinition } from '../types';
import { resolverProducto, obtenerPeriodoReciente, formatPeriodo } from '../helpers';

const schema = z
  .object({
    producto: z.string().min(2).optional().describe('Nombre (parcial o completo) del producto a comparar entre cadenas.'),
    clasificacion: z.enum(['A', 'AA', 'B', 'C', 'NE']).optional().describe('Clasificación de producto a comparar entre cadenas, si no se especifica un producto puntual.'),
    periodo: z.string().regex(/^\d{4}-\d{2}$/).optional().describe('Período en formato YYYY-MM. Si se omite, usa el más reciente disponible.'),
  })
  .refine((v) => v.producto || v.clasificacion, { message: 'Debes especificar un producto o una clasificación.' });

export const comparativoCadenas: SkillDefinition<z.infer<typeof schema>> = {
  name: 'comparativo_cadenas',
  description: 'Compara venta entre BP y HYS para un producto específico o una clasificación completa, en un período. Úsala para preguntas tipo "BP vs HYS" o "qué cadena vende más X".',
  schema,
  async run({ supabase, empresa_id }, params) {
    const periodo = params.periodo ? `${params.periodo}-01` : await obtenerPeriodoReciente(supabase, empresa_id);
    if (!periodo) {
      return { data: null, chartSpec: null, resumenDatos: 'No hay datos cargados para esta empresa.' };
    }

    let etiqueta = '';
    let query = supabase.from('v_ranking_producto').select('*').eq('empresa_id', empresa_id).eq('periodo', periodo);

    if (params.producto) {
      const producto = await resolverProducto(supabase, empresa_id, params.producto);
      if (!producto) {
        return { data: null, chartSpec: null, resumenDatos: `No se encontró ningún producto que coincida con "${params.producto}".` };
      }
      query = query.eq('producto_id', producto.id);
      etiqueta = producto.nombre;
    } else if (params.clasificacion) {
      query = query.eq('clasificacion', params.clasificacion);
      etiqueta = `clasificación ${params.clasificacion}`;
    }

    const { data } = await query;
    const filas = data ?? [];
    if (filas.length === 0) {
      return { data: null, chartSpec: null, resumenDatos: `Sin datos para ${etiqueta} en ${formatPeriodo(periodo)}.` };
    }

    const porCadena = new Map<string, { unidades: number; neto: number }>();
    for (const f of filas) {
      const cur = porCadena.get(f.cadena_codigo) ?? { unidades: 0, neto: 0 };
      cur.unidades += Number(f.total_unidades);
      cur.neto += Number(f.total_neto);
      porCadena.set(f.cadena_codigo, cur);
    }

    const chartData = Array.from(porCadena.entries()).map(([cadena, v]) => ({ cadena, valor: v.neto, unidades: v.unidades }));

    return {
      data: chartData,
      chartSpec: { type: 'bar', xKey: 'cadena', series: [{ key: 'valor', label: 'Valor S/' }], data: chartData },
      resumenDatos: JSON.stringify({ filtro: etiqueta, periodo: formatPeriodo(periodo), porCadena: chartData }),
    };
  },
};
