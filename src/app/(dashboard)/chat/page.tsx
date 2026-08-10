import { createClient } from '@/lib/supabase/server';
import { ChatView } from './ChatView';
import type { ChartSpec } from '@/lib/skills/types';

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let sesionId: string | null = null;
  let mensajes: { role: 'user' | 'assistant'; content: string; chart_spec?: ChartSpec | null }[] = [];

  if (user) {
    const { data: sesion } = await supabase
      .from('chat_sesiones')
      .select('id')
      .eq('usuario_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sesion) {
      sesionId = sesion.id;
      const { data: historial } = await supabase
        .from('chat_mensajes')
        .select('role, content, chart_spec')
        .eq('sesion_id', sesion.id)
        .order('created_at', { ascending: true })
        .limit(50);

      mensajes = (historial ?? [])
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content, chart_spec: m.chart_spec as ChartSpec | null }));
    }
  }

  return <ChatView sesionInicial={sesionId} mensajesIniciales={mensajes} />;
}
