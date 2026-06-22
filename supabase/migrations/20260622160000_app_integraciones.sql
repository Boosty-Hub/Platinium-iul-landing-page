-- ════════════════════════════════════════════════════════════════════════════
-- Admin: configuración de integraciones (Kommo, RingCentral, General)
-- Tabla RLS admin-only. Los secretos NO se exponen al cliente: la RPC de lectura
-- los redacta y solo informa si están seteados; la de upsert hace MERGE (no pisa
-- un secreto si no se envía uno nuevo). El edge la lee con service_role.
-- Sigue el estándar Boosty (secretos fuera de tablas legibles por anon/auth).
-- Idempotente.
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS public.app_integraciones (
  clave           TEXT PRIMARY KEY,                 -- 'kommo' | 'ringcentral' | 'general'
  nombre          TEXT NOT NULL,
  activo          BOOLEAN NOT NULL DEFAULT false,
  config          JSONB NOT NULL DEFAULT '{}'::jsonb,
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_por UUID
);
ALTER TABLE public.app_integraciones ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_integraciones FROM anon, authenticated, PUBLIC;
-- Sin policies → ni anon ni authenticated acceden directo. Solo SECDEF + service_role.

-- Claves que SIEMPRE se tratan como secreto (se redactan al leer).
CREATE OR REPLACE FUNCTION public._claves_secretas()
RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
  SELECT ARRAY['access_token','client_secret','jwt_token','password','secret','api_key','webhook_secret']
$$;

-- ── Lectura (admin): redacta secretos, informa cuáles están seteados ─────────
CREATE OR REPLACE FUNCTION public.admin_get_integraciones()
RETURNS JSON
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_secret_keys text[] := public._claves_secretas();
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN COALESCE((
    SELECT json_agg(json_build_object(
      'clave', i.clave,
      'nombre', i.nombre,
      'activo', i.activo,
      'config', (SELECT COALESCE(jsonb_object_agg(k, v), '{}'::jsonb)
                 FROM jsonb_each(i.config) AS e(k, v)
                 WHERE NOT (k = ANY(v_secret_keys))),
      'secretos', (SELECT COALESCE(jsonb_object_agg(sk, (i.config ? sk) AND COALESCE(i.config->>sk,'') <> ''), '{}'::jsonb)
                   FROM unnest(v_secret_keys) AS sk),
      'actualizado_en', i.actualizado_en
    ) ORDER BY i.clave)
    FROM public.app_integraciones i
  ), '[]'::json);
END;
$$;

-- ── Upsert (admin): MERGE de config (no pisa secretos si no se envía uno) ────
CREATE OR REPLACE FUNCTION public.admin_upsert_integracion(
  p_clave   TEXT,
  p_nombre  TEXT,
  p_config  JSONB,
  p_activo  BOOLEAN
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_secret_keys text[] := public._claves_secretas();
  v_clean jsonb := COALESCE(p_config, '{}'::jsonb);
  sk text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Descartar secretos vacíos para no pisar los existentes con ''.
  FOREACH sk IN ARRAY v_secret_keys LOOP
    IF v_clean ? sk AND COALESCE(v_clean->>sk,'') = '' THEN
      v_clean := v_clean - sk;
    END IF;
  END LOOP;

  INSERT INTO public.app_integraciones (clave, nombre, activo, config, actualizado_en, actualizado_por)
  VALUES (p_clave, COALESCE(p_nombre, p_clave), COALESCE(p_activo,false), v_clean, now(), auth.uid())
  ON CONFLICT (clave) DO UPDATE
    SET nombre          = COALESCE(EXCLUDED.nombre, app_integraciones.nombre),
        activo          = COALESCE(p_activo, app_integraciones.activo),
        config          = app_integraciones.config || v_clean,   -- MERGE
        actualizado_en  = now(),
        actualizado_por = auth.uid();

  RETURN (SELECT json_build_object('ok', true, 'clave', p_clave));
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_integraciones()                       FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_upsert_integracion(TEXT,TEXT,JSONB,BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_integraciones()                       TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_integracion(TEXT,TEXT,JSONB,BOOLEAN) TO authenticated;

-- Auditar cambios de configuración (alta sensibilidad)
DROP TRIGGER IF EXISTS audit_app_integraciones ON public.app_integraciones;
CREATE TRIGGER audit_app_integraciones
  AFTER INSERT OR UPDATE OR DELETE ON public.app_integraciones
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- Seed de los módulos (vacíos, inactivos)
INSERT INTO public.app_integraciones (clave, nombre, activo, config) VALUES
  ('kommo',       'Kommo CRM',   false, '{}'::jsonb),
  ('ringcentral', 'RingCentral', false, '{}'::jsonb)
ON CONFLICT (clave) DO NOTHING;

COMMIT;
