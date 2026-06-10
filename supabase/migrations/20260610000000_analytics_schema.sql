-- Analytics: user journey tracking
-- Tables: analytics_sessions, analytics_pageviews, analytics_events
-- Only the ingest-event edge function (service role) can write.
-- Dashboard reads via SECURITY DEFINER RPCs.

-- ─────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────

CREATE TABLE public.analytics_sessions (
  id            UUID PRIMARY KEY,                -- client-generated session ID
  visitor_id    UUID NOT NULL,                   -- persistent across sessions (localStorage)
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_anon       TEXT,                            -- IPv4: last octet removed; IPv6: /48 prefix
  user_agent    TEXT,
  entry_path    TEXT NOT NULL DEFAULT '/',
  referrer      TEXT,
  utm_source    TEXT,
  utm_medium    TEXT,
  utm_campaign  TEXT
);

ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;

-- One row per page visit within a session.
-- id is client-generated so heartbeat/exit can upsert the same row.
CREATE TABLE public.analytics_pageviews (
  id              UUID PRIMARY KEY,              -- client-generated pageview ID
  session_id      UUID NOT NULL REFERENCES public.analytics_sessions(id) ON DELETE CASCADE,
  visitor_id      UUID NOT NULL,
  path            TEXT NOT NULL,
  viewed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  active_time_ms  INTEGER NOT NULL DEFAULT 0 CHECK (active_time_ms >= 0),
  max_scroll_pct  SMALLINT NOT NULL DEFAULT 0 CHECK (max_scroll_pct BETWEEN 0 AND 100)
);

ALTER TABLE public.analytics_pageviews ENABLE ROW LEVEL SECURITY;

-- Raw events used for heatmaps (clicks and section attention).
CREATE TABLE public.analytics_events (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id   UUID NOT NULL REFERENCES public.analytics_sessions(id) ON DELETE CASCADE,
  visitor_id   UUID NOT NULL,
  path         TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('click', 'section_time')),
  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  data         JSONB NOT NULL DEFAULT '{}'
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────

CREATE INDEX idx_asess_started  ON public.analytics_sessions (started_at DESC);
CREATE INDEX idx_asess_visitor  ON public.analytics_sessions (visitor_id);

CREATE INDEX idx_apv_path_date  ON public.analytics_pageviews (path, viewed_at DESC);
CREATE INDEX idx_apv_session    ON public.analytics_pageviews (session_id);
CREATE INDEX idx_apv_viewed     ON public.analytics_pageviews (viewed_at DESC);

CREATE INDEX idx_aev_path_type  ON public.analytics_events (path, type);
CREATE INDEX idx_aev_occurred   ON public.analytics_events (occurred_at DESC);
CREATE INDEX idx_aev_data_gin   ON public.analytics_events USING GIN (data);

-- ─────────────────────────────────────────────
-- RPC (internal) — Upsert pageview with GREATEST
-- Called by the ingest-event edge function.
-- Uses GREATEST so retried sendBeacon calls don't overwrite higher values.
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION analytics_upsert_pageview(
  p_id          UUID,
  p_session_id  UUID,
  p_visitor_id  UUID,
  p_path        TEXT,
  p_active_ms   INTEGER,
  p_scroll_pct  SMALLINT
)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.analytics_pageviews
    (id, session_id, visitor_id, path, active_time_ms, max_scroll_pct)
  VALUES
    (p_id, p_session_id, p_visitor_id, p_path, p_active_ms, p_scroll_pct)
  ON CONFLICT (id) DO UPDATE
    SET active_time_ms = GREATEST(analytics_pageviews.active_time_ms, EXCLUDED.active_time_ms),
        max_scroll_pct = GREATEST(analytics_pageviews.max_scroll_pct, EXCLUDED.max_scroll_pct),
        -- Update path in case of SPA navigation reuse (rare)
        path           = EXCLUDED.path;
$$;

-- ─────────────────────────────────────────────
-- RPC 1 — Session / pageview stats (cards)
-- Returns: sessions, pageviews, avg_active_ms, avg_max_scroll
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION analytics_session_stats(
  p_path TEXT        DEFAULT NULL,
  p_from TIMESTAMPTZ DEFAULT (now() - INTERVAL '30 days'),
  p_to   TIMESTAMPTZ DEFAULT now()
)
RETURNS JSON
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'sessions',       COUNT(DISTINCT pv.session_id),
    'pageviews',      COUNT(*),
    'avg_active_ms',  COALESCE(ROUND(AVG(pv.active_time_ms) FILTER (WHERE pv.active_time_ms > 0)), 0),
    'avg_max_scroll', COALESCE(ROUND(AVG(pv.max_scroll_pct)), 0)
  )
  FROM public.analytics_pageviews pv
  WHERE pv.viewed_at BETWEEN p_from AND p_to
    AND (p_path IS NULL OR pv.path = p_path);
$$;

-- ─────────────────────────────────────────────
-- RPC 2 — Scroll distribution (abandonment curve)
-- Returns rows: pct (0,10,20,...,100), sessions_reached, pct_reached
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION analytics_scroll_distribution(
  p_path TEXT        DEFAULT NULL,
  p_from TIMESTAMPTZ DEFAULT (now() - INTERVAL '30 days'),
  p_to   TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE (pct SMALLINT, sessions_reached BIGINT, pct_reached NUMERIC)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH buckets AS (
    SELECT generate_series(0, 100, 10)::SMALLINT AS pct
  ),
  total AS (
    SELECT COUNT(DISTINCT session_id) AS n
    FROM public.analytics_pageviews
    WHERE viewed_at BETWEEN p_from AND p_to
      AND (p_path IS NULL OR path = p_path)
  ),
  reached AS (
    SELECT b.pct,
           COUNT(DISTINCT pv.session_id) AS sessions_reached
    FROM buckets b
    LEFT JOIN public.analytics_pageviews pv
      ON pv.max_scroll_pct >= b.pct
     AND pv.viewed_at BETWEEN p_from AND p_to
     AND (p_path IS NULL OR pv.path = p_path)
    GROUP BY b.pct
  )
  SELECT r.pct,
         r.sessions_reached,
         CASE WHEN t.n = 0 THEN 0
              ELSE ROUND(r.sessions_reached::numeric / t.n * 100, 1)
         END AS pct_reached
  FROM reached r, total t
  ORDER BY r.pct;
$$;

-- ─────────────────────────────────────────────
-- RPC 3 — Section attention (attention heatmap)
-- Returns rows: section, avg_active_ms, appearances
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION analytics_section_attention(
  p_path TEXT        DEFAULT NULL,
  p_from TIMESTAMPTZ DEFAULT (now() - INTERVAL '30 days'),
  p_to   TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE (section TEXT, avg_active_ms NUMERIC, appearances BIGINT)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    data->>'section'               AS section,
    ROUND(AVG((data->>'active_ms')::numeric)) AS avg_active_ms,
    COUNT(*)                       AS appearances
  FROM public.analytics_events
  WHERE type = 'section_time'
    AND occurred_at BETWEEN p_from AND p_to
    AND (p_path IS NULL OR path = p_path)
    AND data->>'section' IS NOT NULL
    AND data->>'active_ms' IS NOT NULL
  GROUP BY data->>'section'
  ORDER BY avg_active_ms DESC;
$$;

-- ─────────────────────────────────────────────
-- RPC 4 — Click heatmap grid
-- Returns rows: x (0-100), y (0-100), value (count)
-- Rounded to nearest 2% bucket to reduce noise.
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION analytics_click_heatmap(
  p_path TEXT        DEFAULT NULL,
  p_from TIMESTAMPTZ DEFAULT (now() - INTERVAL '30 days'),
  p_to   TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE (x NUMERIC, y NUMERIC, value BIGINT)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ROUND((data->>'x_pct')::numeric / 2) * 2  AS x,
    ROUND((data->>'y_pct')::numeric / 2) * 2  AS y,
    COUNT(*) AS value
  FROM public.analytics_events
  WHERE type = 'click'
    AND occurred_at BETWEEN p_from AND p_to
    AND (p_path IS NULL OR path = p_path)
    AND data->>'x_pct' IS NOT NULL
    AND data->>'y_pct' IS NOT NULL
  GROUP BY 1, 2
  ORDER BY value DESC
  LIMIT 2000;
$$;

-- ─────────────────────────────────────────────
-- RPC 5 — Known paths (for filter dropdown)
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION analytics_known_paths(
  p_from TIMESTAMPTZ DEFAULT (now() - INTERVAL '30 days'),
  p_to   TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE (path TEXT, pageviews BIGINT)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT path, COUNT(*) AS pageviews
  FROM public.analytics_pageviews
  WHERE viewed_at BETWEEN p_from AND p_to
  GROUP BY path
  ORDER BY pageviews DESC
  LIMIT 50;
$$;
