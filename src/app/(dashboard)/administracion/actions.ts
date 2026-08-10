'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { Rol } from '@/types';

async function getUsuarioActual() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('empresa_id, rol')
    .eq('id', user.id)
    .single();
  if (!usuario) throw new Error('Usuario no encontrado');
  return usuario;
}

// Roles que cada actor puede asignar al enrolar. Un admin no puede crear otro
// admin ni un superadmin (evita escalación de privilegios desde la UI); un
// superadmin sí puede crear admin, pero tampoco otro superadmin (eso se
// reserva a una operación manual directa en la base de datos).
const ROLES_ASIGNABLES: Record<Rol, Rol[]> = {
  admin: ['colaborador'],
  superadmin: ['colaborador', 'admin'],
  colaborador: [],
};

export async function enrolarUsuario(datos: { nombre: string; email: string; password: string; rol: Rol }) {
  const actor = await getUsuarioActual();
  const permitidos = ROLES_ASIGNABLES[actor.rol as Rol] ?? [];
  if (!permitidos.includes(datos.rol)) {
    return { error: 'No tienes permiso para asignar ese rol' };
  }
  if (datos.password.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres' };
  }

  const service = await createServiceClient();

  const { data: nuevoUsuario, error: authError } = await service.auth.admin.createUser({
    email: datos.email.trim().toLowerCase(),
    password: datos.password,
    email_confirm: true,
  });
  if (authError || !nuevoUsuario.user) {
    return { error: authError?.message === 'A user with this email address has already been registered'
      ? 'Ya existe un usuario con ese correo'
      : authError?.message ?? 'No se pudo crear el usuario' };
  }

  const { error: perfilError } = await service.from('usuarios').insert({
    id: nuevoUsuario.user.id,
    empresa_id: actor.empresa_id,
    rol: datos.rol,
    nombre: datos.nombre.trim(),
    estado: 'activo',
  });
  if (perfilError) {
    await service.auth.admin.deleteUser(nuevoUsuario.user.id);
    return { error: perfilError.message };
  }

  revalidatePath('/administracion');
  return { ok: true };
}

export async function actualizarEstadoUsuario(usuarioId: string, estado: 'activo' | 'inactivo') {
  const actor = await getUsuarioActual();
  if (actor.rol !== 'admin' && actor.rol !== 'superadmin') {
    return { error: 'Sin permiso' };
  }

  const service = await createServiceClient();
  const { error } = await service
    .from('usuarios')
    .update({ estado })
    .eq('id', usuarioId)
    .eq('empresa_id', actor.empresa_id);

  if (error) return { error: error.message };
  revalidatePath('/administracion');
  return { ok: true };
}
