-- ════════════════════════════════════════════════════════════════════════════
-- Slice 3: advisor_scorecard SECDEF RPC.
-- Gate: is_admin() OR current_asesor_id() = p_asesor_id (own data only).
-- Aggregates call_attempts for the given asesor in [p_from, p_to].
-- Returns JSON; quality_score = contact_rate*0.6 + notes_rate*0.4.
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.advisor_scorecard(
  p_asesor_id UUID,
  p_from      TIMESTAMPTZ,
  p_to        TIMESTAMPTZ
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_dials              BIGINT;
  v_answered           BIGINT;
  v_contacted          BIGINT;
  v_notes              BIGINT;
  v_avg_ring           NUMERIC;
  v_avg_talk           NUMERIC;
  v_unique_leads       BIGINT;
  v_recordings         BIGINT;
  v_by_hour            JSON;
  v_advisor_answer_rate NUMERIC;
  v_client_contact_rate NUMERIC;
  v_notes_rate         NUMERIC;
  v_quality_score      NUMERIC;
BEGIN
  -- ── Authorization guard ────────────────────────────────────────────────────
  IF NOT (public.is_admin() OR public.current_asesor_id() = p_asesor_id) THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- ── Core aggregations ──────────────────────────────────────────────────────
  SELECT
    COUNT(*)                                                     AS dials,
    COUNT(*) FILTER (WHERE answered_at IS NOT NULL)             AS answered,
    COUNT(*) FILTER (WHERE outcome = 'contactado')              AS contacted,
    COUNT(*) FILTER (WHERE notas IS NOT NULL AND notas <> '')   AS notes,
    ROUND(AVG(ring_time_sec)::NUMERIC, 1)                       AS avg_ring,
    ROUND(AVG(talk_time_sec) FILTER (WHERE talk_time_sec IS NOT NULL)::NUMERIC, 1)
                                                                 AS avg_talk,
    COUNT(DISTINCT lead_id)                                      AS unique_leads,
    COUNT(*) FILTER (WHERE recording_storage_path IS NOT NULL)  AS recordings
  INTO
    v_dials, v_answered, v_contacted, v_notes,
    v_avg_ring, v_avg_talk, v_unique_leads, v_recordings
  FROM public.call_attempts
  WHERE asesor_id = p_asesor_id
    AND inicio_at >= p_from
    AND inicio_at <= p_to;

  -- ── Calls by hour (distribution) ──────────────────────────────────────────
  SELECT json_object_agg(
    hr::TEXT,
    cnt
    ORDER BY hr
  )
  INTO v_by_hour
  FROM (
    SELECT
      EXTRACT(HOUR FROM inicio_at AT TIME ZONE 'America/New_York')::INT AS hr,
      COUNT(*) AS cnt
    FROM public.call_attempts
    WHERE asesor_id = p_asesor_id
      AND inicio_at >= p_from
      AND inicio_at <= p_to
      AND inicio_at IS NOT NULL
    GROUP BY 1
  ) sub;

  -- ── Rate calculations (guard division by zero) ─────────────────────────────
  v_advisor_answer_rate := CASE
    WHEN v_dials = 0 THEN 0
    ELSE ROUND((v_answered::NUMERIC / v_dials), 4)
  END;

  v_client_contact_rate := CASE
    WHEN v_dials = 0 THEN 0
    ELSE ROUND((v_contacted::NUMERIC / v_dials), 4)
  END;

  v_notes_rate := CASE
    WHEN v_dials = 0 THEN 0
    ELSE ROUND((v_notes::NUMERIC / v_dials), 4)
  END;

  -- quality_score = contact_rate*0.6 + notes_rate*0.4  (capped at 1.0)
  v_quality_score := ROUND(
    LEAST(v_client_contact_rate * 0.6 + v_notes_rate * 0.4, 1.0),
    2
  );

  -- ── Build result JSON ──────────────────────────────────────────────────────
  RETURN json_build_object(
    'asesor_id',            p_asesor_id,
    'from',                 p_from,
    'to',                   p_to,
    'dials',                v_dials,
    'advisor_answer_rate',  v_advisor_answer_rate,
    'client_contact_rate',  v_client_contact_rate,
    'avg_ring_sec',         COALESCE(v_avg_ring, 0),
    'avg_talk_sec',         COALESCE(v_avg_talk, 0),
    'calls_by_hour',        COALESCE(v_by_hour, '{}'::json),
    'unique_leads_contacted', v_unique_leads,
    'recordings_count',     v_recordings,
    'notes_rate',           v_notes_rate,
    'quality_score',        v_quality_score
  );
END;
$$;

-- ── Permissions (Boosty standard: least-privilege) ────────────────────────────
REVOKE ALL ON FUNCTION public.advisor_scorecard(UUID, TIMESTAMPTZ, TIMESTAMPTZ)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.advisor_scorecard(UUID, TIMESTAMPTZ, TIMESTAMPTZ)
  TO authenticated;
