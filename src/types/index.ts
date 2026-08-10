export type Rol = "superadmin" | "admin" | "colaborador";

export interface Usuario {
  id: string;
  empresa_id: string;
  rol: Rol;
  nombre: string;
  estado: "activo" | "inactivo";
}

export interface Empresa {
  id: string;
  nombre: string;
  config: Record<string, unknown>;
}

export type EstadoCarga = "pendiente" | "procesando" | "completado" | "error";

export interface Carga {
  id: string;
  empresa_id: string;
  cadena_id: string;
  nombre: string;
  periodo: string;
  estado: EstadoCarga;
  subido_por?: string;
  filas_total?: number;
  filas_ok?: number;
  filas_error?: number;
  created_at: string;
  updated_at: string;
}

export type TipoPendiente = "producto" | "local" | "geo";
export type EstadoPendiente = "pendiente" | "resuelto" | "descartado";

export interface PendienteMapeo {
  id: string;
  empresa_id: string;
  carga_id: string;
  cadena_id: string;
  tipo: TipoPendiente;
  valor_origen: string;
  fila_json: Record<string, unknown>;
  estado: EstadoPendiente;
  resuelto_por?: string;
  created_at: string;
  updated_at: string;
}

export type ChatRole = "user" | "assistant" | "tool";

export interface ChatSesion {
  id: string;
  empresa_id: string;
  usuario_id: string;
  titulo: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMensaje {
  id: string;
  sesion_id: string;
  role: ChatRole;
  content: string;
  skill_invocada: string | null;
  chart_spec: unknown | null;
  tokens_entrada: number | null;
  tokens_salida: number | null;
  costo_estimado: number | null;
  created_at: string;
}
