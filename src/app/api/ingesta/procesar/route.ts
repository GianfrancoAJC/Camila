import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { parsearFilas } from '@/lib/ingesta/parsers';
import { ejecutarPipeline } from '@/lib/ingesta/pipeline';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    // Verificar sesión
    const supabaseUser = await createClient();
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Obtener empresa_id y rol del usuario
    const { data: usuario } = await supabaseUser
      .from('usuarios')
      .select('empresa_id, rol')
      .eq('id', user.id)
      .single();

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 403 });
    }

    // Parsear FormData
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const cadena = formData.get('cadena') as 'BP' | 'HYS' | null;
    const anio = formData.get('anio') as string | null;
    const mes = formData.get('mes') as string | null;

    if (!file || !cadena || !anio || !mes) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }
    if (!['BP', 'HYS'].includes(cadena)) {
      return NextResponse.json({ error: 'Cadena inválida' }, { status: 400 });
    }

    const anioNum = parseInt(anio, 10);
    const mesNum = parseInt(mes, 10);
    if (isNaN(anioNum) || isNaN(mesNum) || mesNum < 1 || mesNum > 12) {
      return NextResponse.json({ error: 'Periodo inválido' }, { status: 400 });
    }

    const periodo = `${anioNum}-${String(mesNum).padStart(2, '0')}-01`;
    const supabase = await createServiceClient();

    // Obtener cadena_id
    const { data: dimCadena } = await supabase
      .from('dim_cadena')
      .select('id')
      .eq('empresa_id', usuario.empresa_id)
      .eq('codigo', cadena)
      .single();

    if (!dimCadena) {
      return NextResponse.json({ error: `Cadena ${cadena} no encontrada` }, { status: 400 });
    }

    // Subir archivo a Storage
    const fileBuffer = await file.arrayBuffer();
    const storagePath = `${usuario.empresa_id}/${cadena}/${anio}-${mes.padStart(2, '0')}/${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('cargas-csv')
      .upload(storagePath, fileBuffer, {
        contentType: 'text/csv',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      // Continuar aunque falle el storage (el pipeline puede seguir)
    }

    // Crear registro en cargas
    const { data: carga, error: cargaError } = await supabase
      .from('cargas')
      .insert({
        empresa_id: usuario.empresa_id,
        cadena_id: dimCadena.id,
        nombre: file.name,
        periodo,
        estado: 'procesando',
        subido_por: user.id,
      })
      .select('id')
      .single();

    if (cargaError || !carga) {
      return NextResponse.json({ error: 'Error al crear registro de carga' }, { status: 500 });
    }

    // Parsear CSV
    const csvText = new TextDecoder('utf-8').decode(fileBuffer).replace(/^﻿/, '');
    const { data: rows, errors } = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });

    if (errors.length > 0 && rows.length === 0) {
      await supabase
        .from('cargas')
        .update({ estado: 'error', filas_total: 0, filas_ok: 0, filas_error: 0 })
        .eq('id', carga.id);
      return NextResponse.json({ error: 'Error al parsear el CSV' }, { status: 400 });
    }

    // Normalizar filas según la cadena
    const filas = parsearFilas(rows, cadena);

    // Ejecutar pipeline
    const resultado = await ejecutarPipeline({
      supabase,
      empresa_id: usuario.empresa_id,
      cadena_id: dimCadena.id,
      carga_id: carga.id,
      filas,
    });

    // Actualizar estado de la carga
    await supabase
      .from('cargas')
      .update({
        estado: 'completado',
        filas_total: filas.length,
        filas_ok: resultado.filas_ok,
        filas_error: resultado.filas_error,
        updated_at: new Date().toISOString(),
      })
      .eq('id', carga.id);

    return NextResponse.json({
      carga_id: carga.id,
      filas_total: filas.length,
      filas_ok: resultado.filas_ok,
      filas_error: resultado.filas_error,
      pendientes: resultado.pendientes,
    });
  } catch (err) {
    console.error('Pipeline error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
