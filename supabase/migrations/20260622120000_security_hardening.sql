-- ════════════════════════════════════════════════════════════════════════════
-- Boosty Security Standard — Hardening (Platinium IUL landing)
-- Fecha: 2026-06-22
--
-- Cierra la brecha confirmada empíricamente con la anon key real:
--   · GRANT ALL … TO anon/authenticated en TODAS las tablas (anti-patrón Cusica).
--   · Policy public_read_leads_panel → anon SELECT de toda la PII de leads.
--   · RPCs SECDEF de analytics heredando EXECUTE de PUBLIC → anon leía/escribía.
--
-- Modelo: el sitio PÚBLICO no toca la DB con la anon key — escribe leads y
-- eventos SOLO vía edge functions (service_role). Por eso revocar todo a anon
-- NO rompe el landing. Los paneles pasan a requerir staff autenticado.
--
-- Reversible. Idempotente.
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Modelo de staff ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.usuarios_sistema (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  rol        TEXT NOT NULL DEFAULT 'staff' CHECK (rol IN ('staff','admin')),
  activo     BOOLEAN NOT NULL DEFAULT true,
  creado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.usuarios_sistema ENABLE ROW LEVEL SECURITY;
-- Sin policies → ni anon ni authenticated la leen directo. Solo SECDEF + service_role.
REVOKE ALL ON public.usuarios_sistema FROM anon, authenticated, PUBLIC;

-- ── 2. Predicados SECDEF (guards) ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_sistema_user()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios_sistema u
    WHERE u.user_id = auth.uid() AND u.activo
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios_sistema u
    WHERE u.user_id = auth.uid() AND u.activo AND u.rol = 'admin'
  );
$$;

-- ── 3. Matar el GRANT ALL y cerrar la herencia de EXECUTE ───────────────────
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

-- Los predicados deben poder evaluarse en las policies.
GRANT EXECUTE ON FUNCTION public.is_sistema_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin()        TO anon, authenticated;

-- ── 4. leads — solo staff; eliminar la lectura pública de PII ───────────────
DROP POLICY IF EXISTS public_read_leads_panel ON public.leads;
DROP POLICY IF EXISTS staff_select_leads      ON public.leads;
DROP POLICY IF EXISTS staff_update_leads      ON public.leads;

CREATE POLICY staff_select_leads ON public.leads
  FOR SELECT TO authenticated USING (public.is_sistema_user());
CREATE POLICY staff_update_leads ON public.leads
  FOR UPDATE TO authenticated USING (public.is_sistema_user()) WITH CHECK (public.is_sistema_user());
-- INSERT/DELETE: sin policy → solo edge (service_role bypasea RLS).

-- Privilegios de columna que el staff necesita (RLS sigue filtrando filas).
GRANT SELECT, UPDATE ON public.leads TO authenticated;

-- ── 5. Tablas de analytics: quedan bloqueadas (RLS on, sin policies). ────────
-- Escritura vía edge (service_role). Lectura de staff SOLO vía RPCs guardadas.

-- ── 6. RPCs de analytics → guardadas + least-privilege ──────────────────────
-- 6a. upsert (interno, lo llama el edge con service_role)
CREATE OR REPLACE FUNCTION public.analytics_upsert_pageview(
  p_id UUID, p_session_id UUID, p_visitor_id UUID,
  p_path TEXT, p_active_ms INTEGER, p_scroll_pct SMALLINT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_sistema_user() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = 'insufficient_privilege';
  END IF;
  INSERT INTO public.analytics_pageviews
    (id, session_id, visitor_id, path, active_time_ms, max_scroll_pct)
  VALUES (p_id, p_session_id, p_visitor_id, p_path, p_active_ms, p_scroll_pct)
  ON CONFLICT (id) DO UPDATE
    SET active_time_ms = GREATEST(analytics_pageviews.active_time_ms, EXCLUDED.active_time_ms),
        max_scroll_pct = GREATEST(analytics_pageviews.max_scroll_pct, EXCLUDED.max_scroll_pct),
        path           = EXCLUDED.path;
END;
$$;

-- 6b. lecturas (las llama el panel autenticado)
CREATE OR REPLACE FUNCTION public.analytics_session_stats(
  p_path TEXT DEFAULT NULL,
  p_from TIMESTAMPTZ DEFAULT (now() - INTERVAL '30 days'),
  p_to   TIMESTAMPTZ DEFAULT now()
)
RETURNS JSON
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_sistema_user() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN (
    SELECT json_build_object(
      'sessions',       COUNT(DISTINCT pv.session_id),
      'pageviews',      COUNT(*),
      'avg_active_ms',  COALESCE(ROUND(AVG(pv.active_time_ms) FILTER (WHERE pv.active_time_ms > 0)), 0),
      'avg_max_scroll', COALESCE(ROUND(AVG(pv.max_scroll_pct)), 0)
    )
    FROM public.analytics_pageviews pv
    WHERE pv.viewed_at BETWEEN p_from AND p_to
      AND (p_path IS NULL OR pv.path = p_path)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.analytics_scroll_distribution(
  p_path TEXT DEFAULT NULL,
  p_from TIMESTAMPTZ DEFAULT (now() - INTERVAL '30 days'),
  p_to   TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE (pct SMALLINT, sessions_reached BIGINT, pct_reached NUMERIC)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_sistema_user() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN QUERY
  WITH buckets AS (SELECT generate_series(0, 100, 10)::SMALLINT AS pct),
  total AS (
    SELECT COUNT(DISTINCT session_id) AS n FROM public.analytics_pageviews
    WHERE viewed_at BETWEEN p_from AND p_to AND (p_path IS NULL OR path = p_path)
  ),
  reached AS (
    SELECT b.pct, COUNT(DISTINCT pv.session_id) AS sessions_reached
    FROM buckets b
    LEFT JOIN public.analytics_pageviews pv
      ON pv.max_scroll_pct >= b.pct
     AND pv.viewed_at BETWEEN p_from AND p_to
     AND (p_path IS NULL OR pv.path = p_path)
    GROUP BY b.pct
  )
  SELECT r.pct, r.sessions_reached,
         CASE WHEN t.n = 0 THEN 0 ELSE ROUND(r.sessions_reached::numeric / t.n * 100, 1) END
  FROM reached r, total t ORDER BY r.pct;
END;
$$;

CREATE OR REPLACE FUNCTION public.analytics_section_attention(
  p_path TEXT DEFAULT NULL,
  p_from TIMESTAMPTZ DEFAULT (now() - INTERVAL '30 days'),
  p_to   TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE (section TEXT, avg_active_ms NUMERIC, appearances BIGINT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_sistema_user() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN QUERY
  SELECT data->>'section',
         ROUND(AVG((data->>'active_ms')::numeric)),
         COUNT(*)
  FROM public.analytics_events
  WHERE type = 'section_time'
    AND occurred_at BETWEEN p_from AND p_to
    AND (p_path IS NULL OR path = p_path)
    AND data->>'section' IS NOT NULL
    AND data->>'active_ms' IS NOT NULL
  GROUP BY data->>'section'
  ORDER BY 2 DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.analytics_click_heatmap(
  p_path TEXT DEFAULT NULL,
  p_from TIMESTAMPTZ DEFAULT (now() - INTERVAL '30 days'),
  p_to   TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE (x NUMERIC, y NUMERIC, value BIGINT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_sistema_user() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN QUERY
  SELECT ROUND((data->>'x_pct')::numeric / 2) * 2,
         ROUND((data->>'y_pct')::numeric / 2) * 2,
         COUNT(*)
  FROM public.analytics_events
  WHERE type = 'click'
    AND occurred_at BETWEEN p_from AND p_to
    AND (p_path IS NULL OR path = p_path)
    AND data->>'x_pct' IS NOT NULL
    AND data->>'y_pct' IS NOT NULL
  GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 2000;
END;
$$;

CREATE OR REPLACE FUNCTION public.analytics_known_paths(
  p_from TIMESTAMPTZ DEFAULT (now() - INTERVAL '30 days'),
  p_to   TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE (path TEXT, pageviews BIGINT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_sistema_user() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN QUERY
  SELECT pv.path, COUNT(*)
  FROM public.analytics_pageviews pv
  WHERE pv.viewed_at BETWEEN p_from AND p_to
  GROUP BY pv.path ORDER BY 2 DESC LIMIT 50;
END;
$$;

-- 6c. Least-privilege de EXECUTE en las RPCs
REVOKE ALL ON FUNCTION public.analytics_upsert_pageview(UUID,UUID,UUID,TEXT,INTEGER,SMALLINT) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.analytics_upsert_pageview(UUID,UUID,UUID,TEXT,INTEGER,SMALLINT) TO service_role;

REVOKE ALL ON FUNCTION public.analytics_session_stats(TEXT,TIMESTAMPTZ,TIMESTAMPTZ)        FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.analytics_scroll_distribution(TEXT,TIMESTAMPTZ,TIMESTAMPTZ)  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.analytics_section_attention(TEXT,TIMESTAMPTZ,TIMESTAMPTZ)    FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.analytics_click_heatmap(TEXT,TIMESTAMPTZ,TIMESTAMPTZ)        FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.analytics_known_paths(TIMESTAMPTZ,TIMESTAMPTZ)               FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.analytics_session_stats(TEXT,TIMESTAMPTZ,TIMESTAMPTZ)        TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.analytics_scroll_distribution(TEXT,TIMESTAMPTZ,TIMESTAMPTZ)  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.analytics_section_attention(TEXT,TIMESTAMPTZ,TIMESTAMPTZ)    TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.analytics_click_heatmap(TEXT,TIMESTAMPTZ,TIMESTAMPTZ)        TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.analytics_known_paths(TIMESTAMPTZ,TIMESTAMPTZ)              TO authenticated, service_role;

COMMIT;
