import { z } from 'zod';
import type { SkillDefinition } from '../types';
import { resolverCadenaId, obtenerPeriodoReciente, formatPeriodo } from '../helpers';

const schema = z.object({
  top: z.number().int().min(1).max(30).optional().describe('Cantidad de productos a mostrar. Por defecto 10.'),
  metrica: z.enum(['unidades', 'valor']).optional().describe('Criterio de orden: unidades vendidas o valor en soles. Por defecto "valor".'),
  periodo: z.string().regex(/^\d{4}-\d{2}$/).optional().describe('Período en formato YYYY-MM. Si se omite, usa el más reciente disponible.'),
  cadena: z.enum(['BP', 'HYS']).optional().describe('Código de cadena para filtrar.'),
  departamento: z.string().optional().describe('Nombre de departamento para filtrar geográficamente.'),
});

export const rankingProductos: SkillDefinition<z.infer<typeof schema>> = {
  name: 'ranking_productos',
  description: 'Top N productos por unidades o valor vendido en un período, opcionalmente filtrado por cadena o departamento. Úsala para preguntas tipo "top productos" o "qué se vende más".',
  schema,
  async run({ supabase, empresa_id }, params) {
    const periodo = params.periodo ? `${params.periodo}-01` : await obtenerPeriodoReciente(supabase, empresa_id);
    if (!periodo) {
      return { data: null, chartSpec: null, resumenDatos: 'No hay datos cargados para esta empresa.' };
    }

    const cadenaId = params.cadena ? await resolverCadenaId(supabase, params.cadena) : null;
    const top = params.top ?? 10;
    const metrica = params.metrica ?? 'valor';

    let filas: { producto_id: string; producto_nombre: string; clasificacion: string; total_unidades: number; total_neto: number }[];

    if (params.departamento) {
      let query = supabase.from('v_ranking').select('*').eq('empresa_id', empresa_id).eq('periodo', periodo).ilike('departamento', `%${params.departamento}%`);
      if (cadenaId) query = query.eq('cadena_id', cadenaId);
      const { data } = await query;
      const porProducto = new Map<string, { producto_id: string; producto_nombre: string; clasificacion: string; total_unidades: number; total_neto: number }>();
      for (const f of data ?? []) {
        const cur = porProducto.get(f.producto_id) ?? { producto_id: f.producto_id, producto_nombre: f.producto_nombre, clasificacion: f.clasificacion, total_unidades: 0, total_neto: 0 };
        cur.total_unidades += Number(f.total_unidades);
        cur.total_neto += Number(f.total_neto);
        porProducto.set(f.producto_id, cur);
      }
      filas = Array.from(porProducto.values());
    } else {
      let query = supabase.from('v_ranking_producto').select('*').eq('empresa_id', empresa_id).eq('periodo', periodo);
      if (cadenaId) query = query.eq('cadena_id', cadenaId);
      const { data } = await query;
      filas = data ?? [];
    }

    if (filas.length === 0) {
      return { data: null, chartSpec: null, resumenDatos: `Sin datos para el período ${formatPeriodo(periodo)} con esos filtros.` };
    }

    const ordenadas = filas
      .sort((a, b) => (metrica === 'valor' ? b.total_neto - a.total_neto : b.total_unidades - a.total_unidades))
      .slice(0, top);

    const chartData = ordenadas.map((f) => ({
      nombre: f.producto_nombre.length > 28 ? f.producto_nombre.slice(0, 28) + '…' : f.producto_nombre,
      valor: metrica === 'valor' ? f.total_neto : f.total_unidades,
    }));

    return {
      data: ordenadas,
      chartSpec: {
        type: 'bar',
        xKey: 'nombre',
        horizontal: true,
        series: [{ key: 'valor', label: metrica === 'valor' ? 'Valor S/' : 'Unidades' }],
        data: chartData,
      },
      resumenDatos: JSON.stringify({ periodo: formatPeriodo(periodo), metrica, top: ordenadas.map((f) => ({ producto: f.producto_nombre, clasificacion: f.clasificacion, valor: metrica === 'valor' ? f.total_neto : f.total_unidades })) }),
    };
  },
};
