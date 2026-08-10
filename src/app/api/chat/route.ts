import { NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getSkill, skillsToOpenAITools } from '@/lib/skills/registry';

export const maxDuration = 30;

const MODEL = 'gpt-4o-mini';
// Precios públicos por 1M tokens (ajustar si cambia el modelo).
const PRECIO_ENTRADA_POR_M = 0.15;
const PRECIO_SALIDA_POR_M = 0.6;

const bodySchema = z.object({
  // nullish: el cliente manda sesion_id: null cuando aún no hay sesión abierta
  sesion_id: z.string().uuid().nullish(),
  mensaje: z.string().min(1).max(2000),
});

const SYSTEM_PROMPT = `Eres el asistente de inteligencia de negocio de AJR, un laboratorio farmacéutico peruano que distribuye productos a través de las cadenas de boticas BP y HYS.

Tu trabajo es ayudar a los usuarios a entender sus datos de venta, stock y cobertura. Cuando la pregunta del usuario se pueda responder con datos (ventas, stock, ranking, cobertura, comparativas, ubicación geográfica, oportunidades de licitación), usa la herramienta (skill) correspondiente. Nunca inventes cifras ni generes SQL: solo puedes obtener datos a través de las skills disponibles.

Si el usuario no menciona cadena, asume que quiere ver ambas (BP y HYS) combinadas. Si no menciona período, usa el más reciente disponible.

Tras recibir el resultado de una skill, responde en español, de forma breve y concreta (2-4 oraciones), destacando lo más relevante de los datos. No repitas toda la tabla en texto — eso ya se muestra en una tarjeta visual aparte.

Si la pregunta es conversacional o no requiere datos (saludos, agradecimientos, preguntas sobre qué puedes hacer), responde directamente sin usar ninguna skill.`;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('empresa_id, rol')
    .eq('id', user.id)
    .single();
  if (!usuario) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Mensaje inválido' }, { status: 400 });
  const { sesion_id, mensaje } = parsed.data;

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY no configurada en el servidor' }, { status: 500 });
  }

  const service = await createServiceClient();

  let sesionId = sesion_id;
  if (sesionId) {
    const { data: sesion } = await service
      .from('chat_sesiones')
      .select('id')
      .eq('id', sesionId)
      .eq('empresa_id', usuario.empresa_id)
      .eq('usuario_id', user.id)
      .maybeSingle();
    if (!sesion) sesionId = undefined;
  }
  if (!sesionId) {
    const { data: nuevaSesion, error } = await service
      .from('chat_sesiones')
      .insert({ empresa_id: usuario.empresa_id, usuario_id: user.id, titulo: mensaje.slice(0, 60) })
      .select('id')
      .single();
    if (error || !nuevaSesion) return NextResponse.json({ error: 'No se pudo crear la sesión de chat' }, { status: 500 });
    sesionId = nuevaSesion.id;
  }

  await service.from('chat_mensajes').insert({ sesion_id: sesionId, role: 'user', content: mensaje });

  const { data: historial } = await service
    .from('chat_mensajes')
    .select('role, content')
    .eq('sesion_id', sesionId)
    .order('created_at', { ascending: true })
    .limit(20);

  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...(historial ?? []).map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
  ];

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const tools = skillsToOpenAITools();

  let finalText = '';
  let skillInvocada: string | null = null;
  let chartSpec: unknown = null;
  let tokensEntrada = 0;
  let tokensSalida = 0;

  try {
    const completion1 = await openai.chat.completions.create({
      model: MODEL,
      messages,
      tools,
      tool_choice: 'auto',
    });
    tokensEntrada += completion1.usage?.prompt_tokens ?? 0;
    tokensSalida += completion1.usage?.completion_tokens ?? 0;

    const choice = completion1.choices[0];
    const toolCall = choice.message.tool_calls?.[0];

    if (toolCall && toolCall.type === 'function') {
      const skill = getSkill(toolCall.function.name);
      if (!skill) {
        finalText = 'No reconozco esa consulta. ¿Puedes reformularla?';
      } else {
        const argsResult = (() => {
          try {
            return skill.schema.safeParse(JSON.parse(toolCall.function.arguments));
          } catch {
            return { success: false as const, error: null };
          }
        })();

        if (!argsResult.success) {
          finalText = 'Necesito un poco más de detalle para responder eso — ¿podrías precisar el producto, la cadena o el período?';
        } else {
          const result = await skill.run({ supabase: service, empresa_id: usuario.empresa_id }, argsResult.data);
          skillInvocada = skill.name;
          chartSpec = result.chartSpec;

          const completion2 = await openai.chat.completions.create({
            model: MODEL,
            messages: [
              ...messages,
              choice.message,
              { role: 'tool', tool_call_id: toolCall.id, content: result.resumenDatos },
            ],
          });
          tokensEntrada += completion2.usage?.prompt_tokens ?? 0;
          tokensSalida += completion2.usage?.completion_tokens ?? 0;
          finalText = completion2.choices[0].message.content ?? 'Aquí tienes los datos solicitados.';
        }
      }
    } else {
      finalText = choice.message.content ?? 'No pude generar una respuesta.';
    }
  } catch (err) {
    console.error('Error en /api/chat:', err);
    return NextResponse.json({ error: 'Error al consultar el asistente. Intenta de nuevo.' }, { status: 500 });
  }

  const costoEstimado = (tokensEntrada / 1_000_000) * PRECIO_ENTRADA_POR_M + (tokensSalida / 1_000_000) * PRECIO_SALIDA_POR_M;

  await service.from('chat_mensajes').insert({
    sesion_id: sesionId,
    role: 'assistant',
    content: finalText,
    skill_invocada: skillInvocada,
    chart_spec: chartSpec,
    tokens_entrada: tokensEntrada,
    tokens_salida: tokensSalida,
    costo_estimado: costoEstimado,
  });

  await service.from('chat_sesiones').update({ updated_at: new Date().toISOString() }).eq('id', sesionId);

  if (skillInvocada) {
    await service.from('eventos_uso').insert({
      empresa_id: usuario.empresa_id,
      usuario_id: user.id,
      tipo: 'skill_invocada',
      metadata: { skill: skillInvocada },
    });
  }

  return NextResponse.json({
    sesion_id: sesionId,
    mensaje: { role: 'assistant', content: finalText, skill_invocada: skillInvocada, chart_spec: chartSpec },
  });
}
