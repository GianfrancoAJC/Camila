import { z } from 'zod';
import type { SkillDefinition } from '../types';
import { resolverCadenaId, obtenerPeriodoReciente, formatSoles, formatUnidades, formatPeriodo } from '../helpers';

const schema = z.object({
  cadena: z.enum(['BP', 'HYS']).optional().describe('Código de cadena para filtrar. Si se omite, se suman ambas.'),
  periodo: z.string().regex(/^\d{4}-\d{2}$/).optional().describe('Período en formato YYYY-MM. Si se omite, usa el más reciente disponible.'),
});

export const resumenPeriodo: SkillDefinition<z.infer<typeof schema>> = {
  name: 'resumen_periodo',
  description: 'KPIs del período: venta en soles, unidades vendidas, locales activos y cadena con mayor venta. Úsala para preguntas generales tipo "cómo vamos este mes" o "dame un resumen".',
  schema,
  async run({ supabase, empresa_id }, params) {
    const periodo = params.periodo ? `${params.periodo}-01` : await obtenerPeriodoReciente(supabase, empresa_id);
    if (!periodo) {
      return { data: null, chartSpec: null, resumenDatos: 'No hay datos cargados para esta empresa.' };
    }

    const cadenaId = params.cadena ? await resolverCadenaId(supabase, params.cadena) : null;

    let query = supabase.from('v_resumen_periodo').select('*').eq('empresa_id', empresa_id).eq('periodo', periodo);
    if (cadenaId) query = query.eq('cadena_id', cadenaId);
    const { data } = await query;
    const filas = data ?? [];

    if (filas.length === 0) {
      return { data: null, chartSpec: null, resumenDatos: `Sin datos para el período ${formatPeriodo(periodo)}${params.cadena ? ' en ' + params.cadena : ''}.` };
    }

    const totalUnidades = filas.reduce((s, f) => s + Number(f.total_unidades), 0);
    const totalNeto = filas.reduce((s, f) => s + Number(f.total_neto), 0);
    const localesActivos = filas.reduce((s, f) => s + Number(f.locales_activos), 0);
    const topCadena = [...filas].sort((a, b) => Number(b.total_neto) - Number(a.total_neto))[0];

    const items = [
      { label: 'Venta', value: formatSoles(totalNeto) },
      { label: 'Unidades', value: formatUnidades(totalUnidades) },
      { label: 'Locales activos', value: String(localesActivos) },
    ];
    if (!params.cadena && filas.length > 1) {
      items.push({ label: 'Cadena líder', value: `${topCadena.cadena_codigo} (${formatSoles(Number(topCadena.total_neto))})` });
    }

    return {
      data: filas,
      chartSpec: { type: 'kpi', items },
      resumenDatos: JSON.stringify({ periodo: formatPeriodo(periodo), totalUnidades, totalNeto, localesActivos, porCadena: filas.map((f) => ({ cadena: f.cadena_codigo, neto: f.total_neto, unidades: f.total_unidades })) }),
    };
  },
};
