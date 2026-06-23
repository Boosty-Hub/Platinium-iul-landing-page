-- ════════════════════════════════════════════════════════════════════════════
-- lead-call-automation — Motor de llamadas (Fase 2): modelo
-- · Asesor → enum del campo "Responsable" de Kommo (asignación por nombre)
-- · Rotación de asesores resumible entre ticks del cron
-- · Clave única por extensión RC para sembrado idempotente
-- Idempotente. RLS/grants ya definidos en 20260622180000.
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

-- El asesor que contesta se asigna en el campo SELECT "Responsable" de Kommo
-- (sus enums coinciden por nombre con las extensiones RC). El usuario nativo
-- (kommo_user_id) se setea sólo cuando el nombre matchea.
ALTER TABLE public.asesores
  ADD COLUMN IF NOT EXISTS kommo_responsable_enum_id TEXT;

-- Una fila por extensión RC → sembrado/edición idempotente.
CREATE UNIQUE INDEX IF NOT EXISTS uq_asesores_rc_extension
  ON public.asesores (rc_extension) WHERE rc_extension IS NOT NULL;

-- Permite continuar la rotación de asesores en el siguiente tick del cron
-- (presupuesto de tiempo del edge < 2 min).
ALTER TABLE public.call_queue
  ADD COLUMN IF NOT EXISTS advisor_round INTEGER NOT NULL DEFAULT 0;

-- Próximo asesor a intentar (índice en la lista ordenada por `orden`).
ALTER TABLE public.call_queue
  ADD COLUMN IF NOT EXISTS next_asesor_idx INTEGER NOT NULL DEFAULT 0;

COMMIT;
