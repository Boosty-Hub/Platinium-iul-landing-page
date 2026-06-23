-- ════════════════════════════════════════════════════════════════════════════
-- Advisor Cockpit — Slice 1: Asesor role + RLS + advisor_presence
-- Fecha: 2026-06-24
--
-- Additive migration: extends usuarios_sistema to accept 'asesor' rol,
-- adds asesor_id FK to asesores, creates advisor_presence heartbeat table,
-- SECDEF predicates is_asesor()/current_asesor_id()/update_presence() RPC,
-- and additive RLS policies for asesor isolation on existing tables.
--
-- Security contract:
--   · REVOKE ALL FROM anon, authenticated on new objects, then minimal GRANT
--   · SECDEF functions: SET search_path = public, pg_temp + internal guards
--   · All existing admin/staff policies UNCHANGED (only ADD new asesor policies)
--   · No GRANT to anon anywhere
--
-- Idempotent. Reversible.
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Add 'asesor' to usuarios_sistema rol CHECK ───────────────────────────
-- Drop+recreate constraint to extend allowed values (additive, reversible).
ALTER TABLE public.usuarios_sistema DROP CONSTRAINT IF EXISTS usuarios_sistema_rol_check;
ALTER TABLE public.usuarios_sistema ADD CONSTRAINT usuarios_sistema_rol_check
  CHECK (rol IN ('staff', 'admin', 'asesor'));

-- ── 2. Add asesor_id FK column to usuarios_sistema ─────────────────────────
ALTER TABLE public.usuarios_sistema
  ADD COLUMN IF NOT EXISTS asesor_id UUID REFERENCES public.asesores(id) ON DELETE SET NULL;

-- Unique: one auth user per advisor (null rows excluded from uniqueness check)
CREATE UNIQUE INDEX IF NOT EXISTS uq_us_asesor_id
  ON public.usuarios_sistema(asesor_id)
  WHERE asesor_id IS NOT NULL;

-- ── 3. advisor_presence table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.advisor_presence (
  asesor_id    UUID        PRIMARY KEY REFERENCES public.asesores(id) ON DELETE CASCADE,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  disponible   BOOLEAN     NOT NULL DEFAULT true,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.advisor_presence ENABLE ROW LEVEL SECURITY;

-- Least-privilege: no grants to anon/authenticated by default; writes go via SECDEF RPC
REVOKE ALL ON public.advisor_presence FROM anon, authenticated, PUBLIC;
-- authenticated can SELECT (own rows gated by RLS policy below); writes via SECDEF only
GRANT SELECT ON public.advisor_presence TO authenticated;

-- Performance index: engine queries disponible + recency
CREATE INDEX IF NOT EXISTS idx_presence_live
  ON public.advisor_presence(disponible, last_seen_at);

-- ── 4. SECDEF predicates: is_asesor() / current_asesor_id() ─────────────────
-- Mirror the style of is_admin() from 20260622120000_security_hardening.sql
CREATE OR REPLACE FUNCTION public.is_asesor()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios_sistema u
    WHERE u.user_id = auth.uid()
      AND u.activo
      AND u.rol = 'asesor'
      AND u.asesor_id IS NOT NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.current_asesor_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT u.asesor_id
  FROM public.usuarios_sistema u
  WHERE u.user_id = auth.uid()
    AND u.activo
    AND u.rol = 'asesor'
  LIMIT 1;
$$;

-- Least-privilege: revoke then grant only to authenticated
-- (anon must NOT call these; is_asesor is only needed by the asesor's own session)
REVOKE ALL ON FUNCTION public.is_asesor()         FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_asesor_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_asesor()         TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_asesor_id() TO authenticated;

-- ── 5. SECDEF RPC: update_presence(p_disponible) ────────────────────────────
-- Called by the asesor's browser every 30s (heartbeat) and on toggle.
-- Guard: only the linked asesor can update their own presence row.
CREATE OR REPLACE FUNCTION public.update_presence(p_disponible BOOLEAN DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_aid uuid := public.current_asesor_id();
BEGIN
  IF v_aid IS NULL THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = 'insufficient_privilege';
  END IF;
  INSERT INTO public.advisor_presence(asesor_id, last_seen_at, disponible, updated_at)
  VALUES (v_aid, now(), COALESCE(p_disponible, true), now())
  ON CONFLICT (asesor_id) DO UPDATE
    SET last_seen_at = now(),
        disponible   = COALESCE(p_disponible, advisor_presence.disponible),
        updated_at   = now();
END;
$$;

REVOKE ALL ON FUNCTION public.update_presence(BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_presence(BOOLEAN) TO authenticated;

-- ── 6. Additive RLS policies for asesor on existing tables ──────────────────
-- CRITICAL: existing admin/staff policies are NOT touched. Only adding new policies.

-- call_queue: asesor sees only their own assigned rows
DROP POLICY IF EXISTS cq_asesor_select ON public.call_queue;
CREATE POLICY cq_asesor_select ON public.call_queue
  FOR SELECT TO authenticated
  USING (public.is_asesor() AND asesor_id = public.current_asesor_id());

-- call_attempts: asesor sees only attempts for their own asesor_id
DROP POLICY IF EXISTS ca_asesor_select ON public.call_attempts;
CREATE POLICY ca_asesor_select ON public.call_attempts
  FOR SELECT TO authenticated
  USING (public.is_asesor() AND asesor_id = public.current_asesor_id());

-- leads: asesor sees only leads tied to their own call_queue rows
DROP POLICY IF EXISTS leads_asesor_select ON public.leads;
CREATE POLICY leads_asesor_select ON public.leads
  FOR SELECT TO authenticated
  USING (
    public.is_asesor() AND id IN (
      SELECT lead_id FROM public.call_queue
      WHERE asesor_id = public.current_asesor_id()
    )
  );

-- asesores: asesor sees only their own row
DROP POLICY IF EXISTS asesores_asesor_select ON public.asesores;
CREATE POLICY asesores_asesor_select ON public.asesores
  FOR SELECT TO authenticated
  USING (public.is_asesor() AND id = public.current_asesor_id());

-- advisor_presence: admin sees all; asesor sees only own row
DROP POLICY IF EXISTS presence_admin_select  ON public.advisor_presence;
DROP POLICY IF EXISTS presence_asesor_select ON public.advisor_presence;
CREATE POLICY presence_admin_select ON public.advisor_presence
  FOR SELECT TO authenticated
  USING (public.is_admin());
CREATE POLICY presence_asesor_select ON public.advisor_presence
  FOR SELECT TO authenticated
  USING (public.is_asesor() AND asesor_id = public.current_asesor_id());

COMMIT;
