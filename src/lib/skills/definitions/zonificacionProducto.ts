import { z } from 'zod';
import type { SkillDefinition } from '../types';
import { resolverProducto, resolverCadenaId, obtenerUltimosNPeriodos } from '../helpers';

const schema = z.object({
  producto: z.string().min(2).describe('Nombre (parcial o completo) del producto a consultar.'),
  cadena: z.enum(['BP', 'HYS']).optional().describe('Código de cadena para filtrar.'),
});

export const zonificacionProducto: SkillDefinition<z.infer<typeof schema>> = {
  name: 'zonificacion_producto',
  description: 'Dónde se mueve más un producto geográficamente (por departamento/provincia/zona AJR), en los últimos 3 meses. Úsala para preguntas sobre distribución geográfica de ventas de un producto.',
  schema,
  async run({ supabase, empresa_id }, params) {
    const producto = await resolverProducto(supabase, empresa_id, params.producto);
    if (!producto) {
      return { data: null, chartSpec: null, resumenDatos: `No se encontró ningún producto que coincida con "${params.producto}".` };
    }

    const periodos = await obtenerUltimosNPeriodos(supabase, empresa_id, 3);
    if (periodos.length === 0) {
      return { data: null, chartSpec: null, resumenDatos: 'No hay períodos con datos cargados.' };
    }

    const cadenaId = params.cadena ? await resolverCadenaId(supabase, params.cadena) : null;
    let query = supabase
      .from('v_ranking')
      .select('*')
      .eq('empresa_id', empresa_id)
      .eq('producto_id', producto.id)
      .gte('periodo', periodos[0])
      .lte('periodo', periodos[periodos.length - 1]);
    if (cadenaId) query = query.eq('cadena_id', cadenaId);
    const { data } = await query;
    const filas = data ?? [];

    if (filas.length === 0) {
      return { data: null, chartSpec: null, resumenDatos: `Sin ventas geolocalizadas de "${producto.nombre}" en los últimos 3 meses.` };
    }

    const porZona = new Map<string, { departamento: string; provincia: string; distrito: string; total_unidades: number; total_neto: number }>();
    for (const f of filas) {
      if (!f.departamento) continue;
      const key = `${f.departamento}|${f.provincia}|${f.distrito}`;
      const cur = porZona.get(key) ?? { departamento: f.departamento, provincia: f.provincia, distrito: f.distrito, total_unidades: 0, total_neto: 0 };
      cur.total_unidades += Number(f.total_unidades);
      cur.total_neto += Number(f.total_neto);
      porZona.set(key, cur);
    }

    const datos = Array.from(porZona.values()).map((v) => ({ ...v, clasificacion: producto.clasificacion }));

    const porDepartamento = new Map<string, { total_unidades: number; total_neto: number }>();
    for (const d of datos) {
      const cur = porDepartamento.get(d.departamento) ?? { total_unidades: 0, total_neto: 0 };
      cur.total_unidades += d.total_unidades;
      cur.total_neto += d.total_neto;
      porDepartamento.set(d.departamento, cur);
    }

    const { data: zonas } = await supabase.from('v_zona_ajr').select('departamento, vendedor, zona').eq('empresa_id', empresa_id);
    const zonaMap = new Map((zonas ?? []).map((z) => [z.departamento, z.zona]));

    const topDepartamentos = Array.from(porDepartamento.entries())
      .map(([departamento, v]) => ({ departamento, zona: zonaMap.get(departamento), ...v }))
      .sort((a, b) => b.total_neto - a.total_neto)
      .slice(0, 5);

    return {
      data: datos,
      chartSpec: { type: 'map', productoNombre: producto.nombre, datos, topDepartamentos },
      resumenDatos: JSON.stringify({ producto: producto.nombre, topDepartamentos }),
    };
  },
};
