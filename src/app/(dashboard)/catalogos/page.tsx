import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { CatalogosTabs } from './CatalogosTabs';

export default async function CatalogosPage() {
  const supabase = await createClient();

  const [pendRes, prodRes, locRes] = await Promise.all([
    supabase
      .from('pendientes_mapeo')
      .select('id, cadena_id, valor_origen, fila_json, dim_cadena(codigo)')
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: true }),
    supabase
      .from('dim_producto')
      .select('id, nombre, clasificacion, activo')
      .order('clasificacion')
      .order('nombre'),
    supabase
      .from('dim_local')
      .select('id, cod_local, nombre, direccion, tipo, estado, dim_cadena(codigo), dim_ubigeo(departamento, distrito)')
      .order('nombre'),
  ]);

  return (
    <div className="px-6 py-8 max-w-6xl">
      <PageHeader title="Catálogos" description="Maestros de productos, locales y resolución de mapeos pendientes" />

      <CatalogosTabs
        pendientes={(pendRes.data as any) ?? []}
        productos={prodRes.data ?? []}
        locales={(locRes.data as any) ?? []}
      />
    </div>
  );
}
