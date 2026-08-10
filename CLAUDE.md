Camila — Contexto del proyecto

## Stack
- **Frontend + API routes**: Next.js 15 (App Router) · TypeScript · shadcn/ui · Tailwind
- **Base de datos y Auth**: Supabase (PostgreSQL + RLS multi-tenant)
- **AI / Chat**: Vercel AI SDK · OpenAI (gpt-4o por defecto)
- **Monorepo**: Turborepo
- **Deploy**: Vercel (web)

## Estructura de carpetas
```
apps/web/          → Next.js (frontend + API routes)
packages/ui/       → componentes React compartidos
packages/types/    → tipos TypeScript compartidos (incluye supabase gen types)
supabase/          → migraciones SQL y políticas RLS
docs/              → toda la documentación del proyecto (ver abajo)
.claude/           → agentes, skills, hooks
```

## Documentación (regla obligatoria para todos los agentes)
- Todo el contexto sale de `docs/`. Nunca crear `agents/docs/` ni carpetas paralelas.
- Antes de cualquier tarea, leer los archivos relevantes de `docs/`:
  - `docs/architecture/ARCHITECTURE.md` — diseño del sistema
  - `docs/runbooks/ENGINEERING_RUNBOOK.md` — cómo trabajar en este proyecto
  - `docs/runbooks/DEPLOYMENT.md` — cómo desplegar
  - `docs/changelog/active-plan.md` — estado actual y próximos pasos
- Si un archivo no existe en `docs/`, reportarlo. No crearlo en otro lugar.
- Documentación obsoleta → mover a `docs/archive/`, no eliminar.

## Agentes disponibles
Invocar al `cto-agent` cuando la tarea involucre múltiples dominios o el alcance no esté claro.
Para tareas de un solo dominio, invocar directamente al agente especialista:

| Agente | Cuándo invocarlo |
|---|---|
| `cto-agent` | Orquestación, tareas multi-dominio |
| `architecture-agent` | Cambios estructurales, nuevos módulos |
| `frontend-agent` | UI, componentes, API routes de Next.js |
| `backend-agent` | Lógica de negocio, integraciones, Supabase |
| `analytics-agent` | FastAPI, pandas, reportes, ejecución de código |
| `qa-agent` | Tests, validación, regresiones |
| `refactor-agent` | Deuda técnica, consistencia, extracción a packages/ |
| `docs-agent` | Actualizar y archivar documentación |
| `scan-project` | Detectar drift entre código y docs/ (correr semanalmente) |

## Gestión de contexto (crítico)
- **No escanear directorios enteros.** Orientarse primero con `docs/`, luego leer archivos específicos.
- **Para exploración profunda**: delegar a un subagente (`context: fork`). El agente principal solo recibe el resumen.
- **Usar `/clear` al cambiar de tarea.** Usar `/compact` para continuar una tarea larga.
- **Cuando compacte**, preservar siempre: lista de archivos modificados, comandos de test, decisiones arquitectónicas tomadas en la sesión.
- **Referir archivos por ruta**, nunca pegar su contenido completo en el contexto: `ver src/lib/supabase.ts` en lugar de copiar el archivo.

## Ejecución de tareas (pasos atómicos)
Antes de implementar cualquier tarea no trivial:
1. Leer `docs/changelog/active-plan.md`
2. Descomponer la tarea en pasos atómicos (cada paso toca un módulo o archivo)
3. Presentar el plan al usuario para aprobación
4. Ejecutar un paso a la vez, confirmando antes de continuar
5. Al completar cada paso, actualizar `docs/changelog/active-plan.md`

`active-plan.md` debe contener siempre:
- Pasos completados (con archivos modificados)
- Paso actual y su estado
- Próximo paso pendiente
- Contexto mínimo para retomar si la sesión se interrumpe

> Esto permite continuar exactamente donde se quedó en la siguiente sesión sin re-explorar el proyecto.

## Ciclo de mantenimiento
**Al cerrar cada feature:**
- `refactor-agent`: revisar código nuevo — duplicación, tipos `any`, consistencia con módulos existentes
- `docs-agent`: actualizar `docs/changelog/UPDATES_LOG.md` y docs afectados

**Semanalmente:**
- `scan-project`: comparar codebase real vs `docs/ARCHITECTURE.md`, reportar divergencias
- `refactor-agent`: pasada profunda buscando patrones emergentes que valga estandarizar
- `docs-agent`: archivar docs no referenciados en la última semana → `docs/archive/`

## Git y deploy — zona prohibida para agentes
El historial de Git y los deploys los controla únicamente el usuario.
- **Prohibido**: `git add`, `git commit`, `git push`, `git merge`, `git rebase`, y cualquier variante.
- **Prohibido**: comandos de deploy (`vercel deploy`, `render deploy`, etc.).
- **Vercel y Render** despliegan automáticamente al hacer push a `main` — el usuario lo hace manualmente.
- Los agentes solo escriben y modifican archivos. Al terminar una tarea deben detenerse, actualizar `docs/changelog/active-plan.md` con los archivos modificados, y notificar al usuario para que decida qué commitear.

## Multi-tenant y seguridad
- Toda tabla en Supabase debe tener políticas RLS con `tenant_id`.
- Nunca incluir valores reales de credenciales en propuestas, ejemplos o commits. Usar placeholders.
- Secretos: solo en variables de entorno. Nunca en código ni en docs/.
- Migraciones: siempre en `supabase/migrations/`. Nunca modificar la base de datos directamente.

## Estrategia de modelos
- **Planificación** (tareas complejas, arquitectura): Opus
- **Implementación** (ejecución mecánica): Sonnet
- **Subagentes de exploración o revisión**: Haiku (economiza tokens sin sacrificar calidad en tareas acotadas)

## Registro de cambios (obligatorio)
Al cerrar cualquier tarea con cambios, el `docs-agent` debe actualizar:
- `docs/changelog/UPDATES_LOG.md` — siempre
- `docs/changelog/KNOWN_BUGS.md` — si aplica
- `docs/architecture/ARCHITECTURE.md` o `docs/runbooks/DEPLOYMENT.md` — si cambió algo estructural
Este registro no es opcional.