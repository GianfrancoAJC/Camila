import { z } from 'zod';
import type { SkillDefinition } from '../types';
import { resolverCadenaId } from '../helpers';

const schema = z.object({
  cadena: z.enum(['BP', 'HYS']).optional().describe('Código de cadena para filtrar.'),
  clasificacion: z.enum(['A', 'AA', 'B', 'C', 'NE']).optional().describe('Clasificación de producto para filtrar.'),
  departamento: z.string().optional().describe('Nombre de departamento para filtrar geográficamente.'),
  top: z.number().int().min(1).max(50).optional().describe('Cantidad de filas a mostrar. Por defecto 20.'),
});

const SEMAFORO_LABEL: Record<string, string> = { quiebre: 'Quiebre', critico: 'Crítico', bajo: 'Bajo' };

export const coberturaStock: SkillDefinition<z.infer<typeof schema>> = {
  name: 'cobertura_stock',
  description: 'Lista locales/productos con riesgo de quiebre de stock (días de cobertura bajos), con semáforo de urgencia. Úsala para preguntas sobre quiebres, stock bajo o riesgo de desabastecimiento.',
  schema,
  async run({ supabase, empresa_id }, params) {
    const cadenaId = params.cadena ? await resolverCadenaId(supabase, params.cadena) : null;
    const top = params.top ?? 20;

    let query = supabase
      .from('v_cobertura')
      .select('*')
      .eq('empresa_id', empresa_id)
      .in('semaforo', ['quiebre', 'critico', 'bajo'])
      .order('dias_cobertura', { ascending: true, nullsFirst: false })
      .limit(top);
    if (cadenaId) query = query.eq('cadena_id', cadenaId);
    if (params.clasificacion) query = query.eq('clasificacion', params.clasificacion);
    if (params.departamento) query = query.ilike('departamento', `%${params.departamento}%`);

    const { data } = await query;
    const filas = data ?? [];

    if (filas.length === 0) {
      return { data: [], chartSpec: null, resumenDatos: 'Sin alertas de stock con esos filtros — todo en niveles saludables.' };
    }

    const rows = filas.map((f) => ({
      estado: SEMAFORO_LABEL[f.semaforo] ?? f.semaforo,
      producto: `${f.producto_nombre} [${f.clasificacion}]`,
      local: `${f.local_nombre} (${f.cadena_codigo})`,
      stock: f.stock,
      dias_cobertura: f.dias_cobertura ?? '—',
    }));

    return {
      data: filas,
      chartSpec: {
        type: 'table',
        columns: [
          { key: 'estado', label: 'Estado' },
          { key: 'producto', label: 'Producto' },
          { key: 'local', label: 'Local' },
          { key: 'stock', label: 'Stock' },
          { key: 'dias_cobertura', label: 'Días cobertura' },
        ],
        rows,
      },
      resumenDatos: JSON.stringify({ total: filas.length, quiebres: filas.filter((f) => f.semaforo === 'quiebre').length, criticos: filas.filter((f) => f.semaforo === 'critico').length, ejemplos: rows.slice(0, 5) }),
    };
  },
};
