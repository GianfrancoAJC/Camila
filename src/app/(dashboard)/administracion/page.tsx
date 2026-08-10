import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { AdministracionTabs } from './AdministracionTabs';

export default async function AdministracionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: actor } = await supabase
    .from('usuarios')
    .select('empresa_id, rol')
    .eq('id', user.id)
    .single();
  if (!actor || actor.rol === 'colaborador') redirect('/chat');

  const desde30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [{ data: usuarios }, { data: usoPorDia }, { data: usoPorUsuario }] = await Promise.all([
    supabase
      .from('usuarios')
      .select('id, nombre, rol, estado, created_at')
      .eq('empresa_id', actor.empresa_id)
      .order('nombre'),
    supabase
      .from('v_uso_por_dia')
      .select('*')
      .eq('empresa_id', actor.empresa_id)
      .gte('fecha', desde30d)
      .order('fecha', { ascending: true }),
    supabase
      .from('v_uso_por_usuario')
      .select('*')
      .eq('empresa_id', actor.empresa_id)
      .order('costo_estimado', { ascending: false }),
  ]);

  // El email vive solo en auth.users; se resuelve aparte con el cliente de
  // service role (Admin API), no vía RLS/join directo.
  const service = await createServiceClient();
  const { data: authUsers } = await service.auth.admin.listUsers({ perPage: 200 });
  const emailPorId = new Map((authUsers?.users ?? []).map((u) => [u.id, u.email ?? '']));

  const usuariosConEmail = (usuarios ?? []).map((u) => ({ ...u, email: emailPorId.get(u.id) ?? '' }));

  let resumenEmpresas: { empresa_id: string; empresa_nombre: string; mensajes: number; tokens_entrada: number; tokens_salida: number; costo_estimado: number; ultimo_uso: string | null }[] = [];
  if (actor.rol === 'superadmin') {
    const { data } = await service.from('v_uso_resumen_empresa').select('*').order('costo_estimado', { ascending: false });
    resumenEmpresas = data ?? [];
  }

  return (
    <div className="px-6 py-8 max-w-5xl">
      <PageHeader title="Administración" description="Usuarios, métricas de uso y configuración" />

      <AdministracionTabs
        actorRol={actor.rol}
        usuarios={usuariosConEmail}
        usoPorDia={usoPorDia ?? []}
        usoPorUsuario={usoPorUsuario ?? []}
        resumenEmpresas={resumenEmpresas}
      />
    </div>
  );
}
