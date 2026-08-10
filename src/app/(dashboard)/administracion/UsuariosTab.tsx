'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, ToggleLeft, ToggleRight } from 'lucide-react';
import { enrolarUsuario, actualizarEstadoUsuario } from './actions';
import type { Rol } from '@/types';

interface Usuario {
  id: string;
  nombre: string;
  rol: Rol;
  estado: 'activo' | 'inactivo';
  email: string;
}

const ROL_LABEL: Record<Rol, string> = { superadmin: 'SuperAdmin', admin: 'Admin', colaborador: 'Colaborador' };
const ROLES_ASIGNABLES: Record<Rol, Rol[]> = { admin: ['colaborador'], superadmin: ['colaborador', 'admin'], colaborador: [] };

function FilaUsuario({ u, puedeEditar }: { u: Usuario; puedeEditar: boolean }) {
  const [estado, setEstado] = useState(u.estado);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function toggle() {
    const next = estado === 'activo' ? 'inactivo' : 'activo';
    setEstado(next);
    startTransition(async () => {
      await actualizarEstadoUsuario(u.id, next);
      router.refresh();
    });
  }

  return (
    <tr style={{ borderTop: '1px solid var(--border)' }}>
      <td className="px-4 py-3">
        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{u.nombre}</p>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>{u.email}</p>
      </td>
      <td className="px-4 py-3">
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ color: 'var(--primary)', background: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}
        >
          {ROL_LABEL[u.rol]}
        </span>
      </td>
      <td className="px-4 py-3">
        {puedeEditar ? (
          <button
            onClick={toggle}
            disabled={isPending}
            className="flex items-center gap-1.5 text-xs transition-opacity disabled:opacity-40"
            style={{ color: estado === 'activo' ? '#22c55e' : 'var(--muted)' }}
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : estado === 'activo' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
            {estado === 'activo' ? 'Activo' : 'Inactivo'}
          </button>
        ) : (
          <span className="text-xs" style={{ color: estado === 'activo' ? '#22c55e' : 'var(--muted)' }}>
            {estado === 'activo' ? 'Activo' : 'Inactivo'}
          </span>
        )}
      </td>
    </tr>
  );
}

function EnrolarForm({ actorRol }: { actorRol: Rol }) {
  const permitidos = ROLES_ASIGNABLES[actorRol] ?? [];
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<Rol>(permitidos[0] ?? 'colaborador');
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);
  const router = useRouter();

  if (permitidos.length === 0) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setOk(false);
    startTransition(async () => {
      const res = await enrolarUsuario({ nombre, email, password, rol });
      if (res?.error) {
        setErr(res.error);
      } else {
        setNombre('');
        setEmail('');
        setPassword('');
        setOk(true);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border p-4 mb-5 space-y-3" style={{ borderColor: 'var(--border)' }}>
      <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Enrolar nuevo usuario</p>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre completo"
          required
          className="rounded-lg border px-3 py-2 text-sm bg-transparent"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@ajrlabs.com"
          required
          className="rounded-lg border px-3 py-2 text-sm bg-transparent"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña temporal"
          required
          minLength={8}
          className="rounded-lg border px-3 py-2 text-sm bg-transparent"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
        />
        <select
          value={rol}
          onChange={(e) => setRol(e.target.value as Rol)}
          className="rounded-lg border px-3 py-2 text-sm bg-transparent"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
        >
          {permitidos.map((r) => <option key={r} value={r}>{ROL_LABEL[r]}</option>)}
        </select>
      </div>
      {err && <p className="text-xs text-red-500">{err}</p>}
      {ok && <p className="text-xs" style={{ color: '#22c55e' }}>Usuario creado correctamente.</p>}
      <button
        type="submit"
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
        style={{ background: 'var(--primary)', color: '#fff' }}
      >
        {isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        Enrolar
      </button>
    </form>
  );
}

export function UsuariosTab({ usuarios, actorRol }: { usuarios: Usuario[]; actorRol: Rol }) {
  return (
    <div>
      <EnrolarForm actorRol={actorRol} />
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'color-mix(in srgb, var(--border) 30%, transparent)' }}>
              {['Usuario', 'Rol', 'Estado'].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: 'var(--muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <FilaUsuario key={u.id} u={u} puedeEditar={u.rol !== 'superadmin'} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
