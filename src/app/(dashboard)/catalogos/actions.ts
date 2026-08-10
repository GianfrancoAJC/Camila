'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';

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

// ── Pendientes ────────────────────────────────────────────────────

export async function resolverPendiente(pendienteId: string, productoId: string) {
  const usuario = await getUsuarioActual();
  const supabase = await createServiceClient();

  const { data: pendiente, error: fetchErr } = await supabase
    .from('pendientes_mapeo')
    .select('empresa_id, cadena_id, valor_origen, fila_json')
    .eq('id', pendienteId)
    .single();

  if (fetchErr || !pendiente) return { error: 'Pendiente no encontrado' };
  if (pendiente.empresa_id !== usuario.empresa_id) return { error: 'Sin permiso' };

  const fila = pendiente.fila_json as Record<string, string>;

  const { error: mapErr } = await supabase
    .from('map_producto')
    .upsert({
      empresa_id: pendiente.empresa_id,
      cadena_id: pendiente.cadena_id,
      cod_articulo_origen: pendiente.valor_origen,
      nombre_origen: fila?.nombre_producto ?? pendiente.valor_origen,
      producto_id: productoId,
    }, { onConflict: 'cadena_id,cod_articulo_origen' });

  if (mapErr) return { error: mapErr.message };

  await supabase
    .from('pendientes_mapeo')
    .update({ estado: 'resuelto' })
    .eq('id', pendienteId);

  revalidatePath('/catalogos');
  return { ok: true };
}

export async function descartarPendiente(pendienteId: string) {
  const usuario = await getUsuarioActual();
  const supabase = await createServiceClient();

  await supabase
    .from('pendientes_mapeo')
    .update({ estado: 'descartado' })
    .eq('id', pendienteId)
    .eq('empresa_id', usuario.empresa_id);

  revalidatePath('/catalogos');
  return { ok: true };
}

// ── Productos ─────────────────────────────────────────────────────

export async function crearProducto(nombre: string, clasificacion: string) {
  const usuario = await getUsuarioActual();
  const supabase = await createServiceClient();

  const { error } = await supabase.from('dim_producto').insert({
    empresa_id: usuario.empresa_id,
    nombre: nombre.trim().toUpperCase(),
    clasificacion,
    activo: true,
  });

  if (error) return { error: error.message };
  revalidatePath('/catalogos');
  return { ok: true };
}

export async function actualizarProducto(
  productoId: string,
  campos: { clasificacion?: string; activo?: boolean }
) {
  const usuario = await getUsuarioActual();
  const supabase = await createServiceClient();

  const { error } = await supabase
    .from('dim_producto')
    .update(campos)
    .eq('id', productoId)
    .eq('empresa_id', usuario.empresa_id);

  if (error) return { error: error.message };
  revalidatePath('/catalogos');
  return { ok: true };
}

// ── Locales ───────────────────────────────────────────────────────

export async function actualizarLocal(
  localId: string,
  campos: { tipo?: string; estado?: string }
) {
  const usuario = await getUsuarioActual();
  const supabase = await createServiceClient();

  const { error } = await supabase
    .from('dim_local')
    .update(campos)
    .eq('id', localId)
    .eq('empresa_id', usuario.empresa_id);

  if (error) return { error: error.message };
  revalidatePath('/catalogos');
  return { ok: true };
}
