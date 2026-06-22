-- ════════════════════════════════════════════════════════════════════════════
-- lead-call-automation — Modelo de datos
-- Asesores, cola de llamadas, intentos + config de horario. RLS staff/admin,
-- escrituras de la cola/intentos solo service_role (edge). Auditado. Idempotente.
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── util: updated_at automático ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ── ASESORES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.asesores (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre         TEXT NOT NULL,
  rc_extension   TEXT,                       -- extensión RingCentral (ej. '107')
  telefono       TEXT,                       -- número directo opcional
  kommo_user_id  TEXT,                       -- responsible_user_id en Kommo al asignar
  activo         BOOLEAN NOT NULL DEFAULT true,
  orden          INTEGER NOT NULL DEFAULT 0, -- prioridad (modo secuencial)
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.asesores ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.asesores FROM anon, authenticated, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.asesores TO authenticated;
DROP POLICY IF EXISTS asesores_select ON public.asesores;
DROP POLICY IF EXISTS asesores_admin_write ON public.asesores;
CREATE POLICY asesores_select ON public.asesores
  FOR SELECT TO authenticated USING (public.is_sistema_user());
CREATE POLICY asesores_admin_write ON public.asesores
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS trg_asesores_updated ON public.asesores;
CREATE TRIGGER trg_asesores_updated BEFORE UPDATE ON public.asesores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS audit_asesores ON public.asesores;
CREATE TRIGGER audit_asesores AFTER INSERT OR UPDATE OR DELETE ON public.asesores
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- ── COLA DE LLAMADAS (un registro por lead) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.call_queue (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id          UUID NOT NULL UNIQUE REFERENCES public.leads(id) ON DELETE CASCADE,
  estado           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (estado IN ('pending','scheduled','in_progress','contactado','no_contactado','failed','cancelled')),
  scheduled_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_attempts  INTEGER NOT NULL DEFAULT 0,
  asesor_id        UUID REFERENCES public.asesores(id) ON DELETE SET NULL,
  kommo_lead_id    TEXT,
  ultimo_resultado TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.call_queue ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.call_queue FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.call_queue TO authenticated;           -- staff ve; escribe el edge (service_role)
DROP POLICY IF EXISTS call_queue_select ON public.call_queue;
CREATE POLICY call_queue_select ON public.call_queue
  FOR SELECT TO authenticated USING (public.is_sistema_user());

CREATE INDEX IF NOT EXISTS idx_cq_due     ON public.call_queue (estado, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_cq_lead    ON public.call_queue (lead_id);

DROP TRIGGER IF EXISTS trg_cq_updated ON public.call_queue;
CREATE TRIGGER trg_cq_updated BEFORE UPDATE ON public.call_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── INTENTOS DE LLAMADA (log por llamada) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.call_attempts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_queue_id  UUID REFERENCES public.call_queue(id) ON DELETE CASCADE,
  lead_id        UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  asesor_id      UUID REFERENCES public.asesores(id) ON DELETE SET NULL,
  tipo           TEXT NOT NULL DEFAULT 'queue_ring',     -- queue_ring | direct
  rc_session_id  TEXT,
  rc_ringout_id  TEXT,
  estado         TEXT NOT NULL DEFAULT 'initiated'
                 CHECK (estado IN ('initiated','advisor_answered','client_answered','no_answer','voicemail','busy','failed','completed')),
  inicio_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  fin_at         TIMESTAMPTZ,
  duracion_seg   INTEGER,
  recording_id   TEXT,
  recording_url  TEXT,
  kommo_call_id  TEXT,
  notas          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.call_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.call_attempts FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.call_attempts TO authenticated;
DROP POLICY IF EXISTS call_attempts_select ON public.call_attempts;
CREATE POLICY call_attempts_select ON public.call_attempts
  FOR SELECT TO authenticated USING (public.is_sistema_user());

CREATE INDEX IF NOT EXISTS idx_ca_lead    ON public.call_attempts (lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ca_queue   ON public.call_attempts (call_queue_id);
CREATE INDEX IF NOT EXISTS idx_ca_session ON public.call_attempts (rc_session_id);

-- ── CONFIG: horario laboral + reintentos (en app_integraciones) ─────────────
INSERT INTO public.app_integraciones (clave, nombre, activo, config) VALUES
  ('horario', 'Horario y reintentos', true, jsonb_build_object(
    'timezone', 'America/New_York',
    'schedule', jsonb_build_object(
      'lunes',     jsonb_build_object('abre','09:00','cierra','18:00','activo',true),
      'martes',    jsonb_build_object('abre','09:00','cierra','18:00','activo',true),
      'miercoles', jsonb_build_object('abre','09:00','cierra','18:00','activo',true),
      'jueves',    jsonb_build_object('abre','09:00','cierra','18:00','activo',true),
      'viernes',   jsonb_build_object('abre','09:00','cierra','18:00','activo',true),
      'sabado',    jsonb_build_object('abre','10:00','cierra','14:00','activo',false),
      'domingo',   jsonb_build_object('abre','10:00','cierra','14:00','activo',false)
    ),
    'client_retry_delays_min', jsonb_build_array(5,15,30),
    'max_client_attempts', 3,
    'advisor_ring_timeout_sec', 30
  ))
ON CONFLICT (clave) DO NOTHING;

COMMIT;
