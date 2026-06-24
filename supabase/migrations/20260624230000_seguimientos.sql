-- ═══════════════════════════════════════════════════════════════════════════
-- Seguimientos (sistema de recontactos) — idempotente, Boosty-compliant
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Nuevas columnas en tablas existentes ────────────────────────────────
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS disposicion_actual TEXT;

ALTER TABLE call_queue
  ADD COLUMN IF NOT EXISTS solo_asesor_id UUID
    REFERENCES asesores(id) ON DELETE SET NULL;

-- ── 2. Tabla seguimientos ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seguimientos (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         UUID        NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  asesor_id       UUID        REFERENCES asesores(id) ON DELETE SET NULL,
  disposicion     TEXT        NOT NULL,
  nota            TEXT,
  programado_para TIMESTAMPTZ,
  estado          TEXT        NOT NULL DEFAULT 'pendiente'
                  CHECK (estado IN ('pendiente','avisado','hecho','vencido','cancelado')),
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
  completado_en   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_seguimientos_asesor_programado
  ON seguimientos (asesor_id, programado_para);

CREATE INDEX IF NOT EXISTS idx_seguimientos_lead_creado
  ON seguimientos (lead_id, creado_en);

-- trigger updated_at no es necesario (usamos creado_en/completado_en explícitos)

-- ── 3. RLS (Boosty-compliant: REVOKE todo luego GRANT mínimo) ─────────────
ALTER TABLE seguimientos ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas previas si la migración se re-ejecuta
DROP POLICY IF EXISTS "admin_all_seguimientos"     ON seguimientos;
DROP POLICY IF EXISTS "asesor_select_seguimientos" ON seguimientos;
DROP POLICY IF EXISTS "asesor_insert_seguimientos" ON seguimientos;
DROP POLICY IF EXISTS "asesor_update_seguimientos" ON seguimientos;

-- REVOKE permisos amplios (PUBLIC/anon/auth por defecto en Postgres)
REVOKE ALL ON seguimientos FROM PUBLIC;
REVOKE ALL ON seguimientos FROM anon;
REVOKE ALL ON seguimientos FROM authenticated;

-- Mínimo necesario: authenticated puede SELECT/INSERT/UPDATE (controlado por RLS)
GRANT SELECT, INSERT, UPDATE ON seguimientos TO authenticated;

-- Admin: acceso total (uses SECURITY DEFINER helper is_admin() → bypasses RLS)
CREATE POLICY "admin_all_seguimientos" ON seguimientos
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Asesor: solo los propios
CREATE POLICY "asesor_select_seguimientos" ON seguimientos
  FOR SELECT
  TO authenticated
  USING (asesor_id = public.current_asesor_id());

CREATE POLICY "asesor_insert_seguimientos" ON seguimientos
  FOR INSERT
  TO authenticated
  WITH CHECK (asesor_id = public.current_asesor_id());

CREATE POLICY "asesor_update_seguimientos" ON seguimientos
  FOR UPDATE
  TO authenticated
  USING (asesor_id = public.current_asesor_id())
  WITH CHECK (asesor_id = public.current_asesor_id());

-- ── 4. Seed del mapeo disposición→Kommo en app_integraciones ──────────────
-- Merge idempotente: solo toca las claves 'disposiciones' y 'proxima_cita_field_id'.
-- El resto del config de kommo queda intacto gracias al operador ||.
UPDATE app_integraciones
SET config = config || jsonb_build_object(
  'disposiciones', '{
    "no_contesto":        {"stage_id": "100245771", "status_call_key": "no_answer",   "schedulable": false},
    "interesado":         {"stage_id": "106627488", "status_call_key": "completed",   "schedulable": true},
    "llamar_despues":     {"stage_id": "100245767", "status_call_key": "rescheduled", "schedulable": true},
    "cotizacion_enviada": {"stage_id": "100245779", "status_call_key": "completed",   "schedulable": true},
    "cita_agendada":      {"stage_id": "100245767", "status_call_key": "rescheduled", "schedulable": true,  "proxima_cita": true},
    "no_interesado":      {"stage_id": "143",        "status_call_key": "completed",   "schedulable": false},
    "ganado":             {"stage_id": "142",        "status_call_key": "completed",   "schedulable": false},
    "numero_equivocado":  {"stage_id": "143",        "status_call_key": "no_answer",  "schedulable": false}
  }'::jsonb,
  'proxima_cita_field_id', '1989741'
)
WHERE clave = 'kommo';
