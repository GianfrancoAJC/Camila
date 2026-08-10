import { z } from 'zod';
import type { SkillDefinition } from './types';
import { resumenPeriodo } from './definitions/resumenPeriodo';
import { ventasProductoTendencia } from './definitions/ventasProductoTendencia';
import { rankingProductos } from './definitions/rankingProductos';
import { rotacionLocalProducto } from './definitions/rotacionLocalProducto';
import { comparativoCadenas } from './definitions/comparativoCadenas';
import { zonificacionProducto } from './definitions/zonificacionProducto';
import { coberturaStock } from './definitions/coberturaStock';
import { oportunidadLicitacion } from './definitions/oportunidadLicitacion';

export const SKILLS: SkillDefinition<unknown>[] = [
  resumenPeriodo,
  ventasProductoTendencia,
  rankingProductos,
  rotacionLocalProducto,
  comparativoCadenas,
  zonificacionProducto,
  coberturaStock,
  oportunidadLicitacion,
] as unknown as SkillDefinition<unknown>[];

export function getSkill(name: string): SkillDefinition<unknown> | undefined {
  return SKILLS.find((s) => s.name === name);
}

export function skillsToOpenAITools() {
  return SKILLS.map((skill) => {
    const jsonSchema = z.toJSONSchema(skill.schema as z.ZodType) as Record<string, unknown>;
    delete jsonSchema.$schema;
    return {
      type: 'function' as const,
      function: {
        name: skill.name,
        description: skill.description,
        parameters: jsonSchema,
      },
    };
  });
}
