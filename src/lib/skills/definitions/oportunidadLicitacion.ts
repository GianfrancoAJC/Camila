import { z } from 'zod';
import type { SkillDefinition } from '../types';
import { resolverCadenaId } from '../helpers';

const schema = z.object({
  cadena: z.enum(['BP', 'HYS']).optional().describe('Código de cadena para filtrar.'),
  top: z.number().int().min(1).max(30).optional().describe('Cantidad de candidatos a mostrar. Por defecto 15.'),
});

const SEMAFORO_LABEL: Record<string, string> = { quiebre: 'Quiebre', critico: 'Crítico', bajo: 'Bajo' };
const PRIORIDAD_CLASIF: Record<string, number> = { A: 0, AA: 1, B: 2 };

export const oportunidadLicitacion: SkillDefinition<z.infer<typeof schema>> = {
  name: 'oportunidad_licitacion',
  description: 'Productos con venta sostenida y stock bajo/próximo a quiebre, candidatos a licitar con la cadena (priorizados por clasificación A/AA/B). Úsala para preguntas sobre oportunidades comerciales o de licitación.',
  schema,
  async run({ supabase, empresa_id }, params) {
    const cadenaId = params.cadena ? await resolverCadenaId(supabase, params.cadena) : null;
    const top = params.top ?? 15;

    let query = supabase
      .from('v_cobertura')
      .select('*')
      .eq('empresa_id', empresa_id)
      .in('semaforo', ['quiebre', 'critico', 'bajo'])
      .in('clasificacion', ['A', 'AA', 'B'])
      .gt('unidades_dia', 0);
    if (cadenaId) query = query.eq('cadena_id', cadenaId);

    const { data } = await query;
    let filas = data ?? [];

    filas = filas
      .sort((a, b) => {
        const pa = PRIORIDAD_CLASIF[a.clasificacion] ?? 9;
        const pb = PRIORIDAD_CLASIF[b.clasificacion] ?? 9;
        if (pa !== pb) return pa - pb;
        return (a.dias_cobertura ?? 999) - (b.dias_cobertura ?? 999);
      })
      .slice(0, top);

    if (filas.length === 0) {
      return { data: [], chartSpec: null, resumenDatos: 'Sin candidatos a licitación con esos filtros por ahora.' };
    }

    const rows = filas.map((f) => ({
      clasificacion: f.clasificacion,
      estado: SEMAFORO_LABEL[f.semaforo] ?? f.semaforo,
      producto: f.producto_nombre,
      local: `${f.local_nombre} (${f.cadena_codigo})`,
      dias_cobertura: f.dias_cobertura ?? '—',
    }));

    return {
      data: filas,
      chartSpec: {
        type: 'table',
        columns: [
          { key: 'clasificacion', label: 'Clasif.' },
          { key: 'estado', label: 'Estado' },
          { key: 'producto', label: 'Producto' },
          { key: 'local', label: 'Local' },
          { key: 'dias_cobertura', label: 'Días cobertura' },
        ],
        rows,
      },
      resumenDatos: JSON.stringify({ total: filas.length, ejemplos: rows.slice(0, 5) }),
    };
  },
};
