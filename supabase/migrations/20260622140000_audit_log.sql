-- ════════════════════════════════════════════════════════════════════════════
-- Boosty Security Standard — Auditoría a nivel DB
-- El audit log de la app es ciego a escrituras crudas de service_role/SQL.
-- Triggers de auditoría sobre tablas sensibles (leads UPDATE/DELETE,
-- usuarios_sistema INSERT/UPDATE/DELETE). Solo admins leen el log.
-- Idempotente.
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS public.audit_log (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor       TEXT,              -- auth.uid() o 'service'
  action      TEXT NOT NULL,     -- INSERT | UPDATE | DELETE
  table_name  TEXT NOT NULL,
  row_id      TEXT,
  old_data    JSONB,
  new_data    JSONB
);
CREATE INDEX IF NOT EXISTS idx_audit_at        ON public.audit_log (at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_table_row ON public.audit_log (table_name, row_id);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.audit_log FROM anon, authenticated, PUBLIC;

-- Solo admins lo leen (RLS). Nadie lo escribe desde el cliente (lo escribe el trigger SECDEF).
DROP POLICY IF EXISTS admin_read_audit ON public.audit_log;
CREATE POLICY admin_read_audit ON public.audit_log
  FOR SELECT TO authenticated USING (public.is_admin());
GRANT SELECT ON public.audit_log TO authenticated;

-- Trigger genérico (maneja PK 'id' o 'user_id')
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_actor TEXT := COALESCE(auth.uid()::text, 'service');
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log(actor, action, table_name, row_id, old_data)
      VALUES (v_actor, TG_OP, TG_TABLE_NAME,
              COALESCE(to_jsonb(OLD)->>'id', to_jsonb(OLD)->>'user_id'), to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log(actor, action, table_name, row_id, old_data, new_data)
      VALUES (v_actor, TG_OP, TG_TABLE_NAME,
              COALESCE(to_jsonb(NEW)->>'id', to_jsonb(NEW)->>'user_id'), to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSE
    INSERT INTO public.audit_log(actor, action, table_name, row_id, new_data)
      VALUES (v_actor, TG_OP, TG_TABLE_NAME,
              COALESCE(to_jsonb(NEW)->>'id', to_jsonb(NEW)->>'user_id'), to_jsonb(NEW));
    RETURN NEW;
  END IF;
END;
$fn$;
REVOKE ALL ON FUNCTION public.audit_trigger() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS audit_leads ON public.leads;
CREATE TRIGGER audit_leads
  AFTER UPDATE OR DELETE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

DROP TRIGGER IF EXISTS audit_usuarios_sistema ON public.usuarios_sistema;
CREATE TRIGGER audit_usuarios_sistema
  AFTER INSERT OR UPDATE OR DELETE ON public.usuarios_sistema
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

COMMIT;
