import type { SupabaseClient } from '@supabase/supabase-js';
import type { ZodType } from 'zod';

export type ChartSpec =
  | { type: 'kpi'; items: { label: string; value: string }[] }
  | { type: 'line'; xKey: string; xLabels: Record<string, string>; series: { key: string; label: string }[]; data: Record<string, unknown>[] }
  | { type: 'bar'; xKey: string; horizontal?: boolean; series: { key: string; label: string }[]; data: Record<string, unknown>[] }
  | { type: 'table'; columns: { key: string; label: string }[]; rows: Record<string, unknown>[] }
  | { type: 'heatmap'; rowLabel: string; colLabel: string; rows: string[]; cols: string[]; cells: { row: string; col: string; value: number }[] }
  | { type: 'map'; productoNombre?: string; datos: { departamento: string; provincia: string; distrito?: string; clasificacion: string; total_unidades: number; total_neto: number }[]; topDepartamentos: { departamento: string; zona?: string; total_neto: number; total_unidades: number }[] };

export interface SkillResult {
  data: unknown;
  chartSpec: ChartSpec | null;
  resumenDatos: string; // resumen compacto en texto/JSON para pasarle al modelo como contexto, no la data cruda completa
}

export interface SkillContext {
  supabase: SupabaseClient;
  empresa_id: string;
}

export interface SkillDefinition<P = unknown> {
  name: string;
  description: string;
  schema: ZodType<P>;
  run: (ctx: SkillContext, params: P) => Promise<SkillResult>;
}
