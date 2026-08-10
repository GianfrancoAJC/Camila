'use client';

import { useState } from 'react';
import { Users, BarChart3, Building2 } from 'lucide-react';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { UsuariosTab } from './UsuariosTab';
import { UsoTab } from './UsoTab';
import { PanelSuperAdminTab } from './PanelSuperAdminTab';
import type { Rol } from '@/types';

export function AdministracionTabs({
  actorRol,
  usuarios,
  usoPorDia,
  usoPorUsuario,
  resumenEmpresas,
}: {
  actorRol: Rol;
  usuarios: { id: string; nombre: string; rol: Rol; estado: 'activo' | 'inactivo'; email: string }[];
  usoPorDia: any[];
  usoPorUsuario: any[];
  resumenEmpresas: any[];
}) {
  type TabId = 'usuarios' | 'uso' | 'superadmin';
  const tabItems: TabItem<TabId>[] = [
    { id: 'usuarios', label: 'Usuarios', icon: Users },
    { id: 'uso', label: 'Uso', icon: BarChart3 },
    ...(actorRol === 'superadmin' ? [{ id: 'superadmin' as const, label: 'Panel SuperAdmin', icon: Building2 }] : []),
  ];

  const [tab, setTab] = useState<TabId>('usuarios');

  return (
    <div>
      <Tabs tabs={tabItems} active={tab} onChange={setTab} />

      {tab === 'usuarios' && <UsuariosTab usuarios={usuarios} actorRol={actorRol} />}
      {tab === 'uso' && <UsoTab usoPorDia={usoPorDia} usoPorUsuario={usoPorUsuario} />}
      {tab === 'superadmin' && <PanelSuperAdminTab resumenEmpresas={resumenEmpresas} />}
    </div>
  );
}
