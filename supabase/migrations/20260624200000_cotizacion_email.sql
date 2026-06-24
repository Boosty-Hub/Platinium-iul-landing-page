-- ════════════════════════════════════════════════════════════════════════════
-- Cotización email — columnas en leads + seed de integración Resend
-- Idempotente. No toca tablas existentes de manera destructiva.
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Columnas de tracking en leads ────────────────────────────────────────
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS cotizacion_enviada_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cotizacion_monto      INTEGER;

-- ── 2. Seed de la integración Resend ────────────────────────────────────────
-- El admin configurará: api_key, from_email, from_name, reply_to,
-- logo_platinium, logo_nlg (opcional).
INSERT INTO public.app_integraciones (clave, nombre, activo, config)
VALUES (
  'resend',
  'Resend (email)',
  false,
  '{}'::jsonb
)
ON CONFLICT (clave) DO NOTHING;

COMMIT;
