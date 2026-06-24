-- ─────────────────────────────────────────────────────────────────────────────
-- Slice 2: Enrich call_attempts for advisor cockpit
-- All columns nullable + idempotent (ADD COLUMN IF NOT EXISTS).
-- outcome check mirrors the design doc values; forward-compat AI columns
-- added with NO pipeline wired (transcript_* are schema-only for Slice 3+).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.call_attempts
  ADD COLUMN IF NOT EXISTS ring_time_sec         INTEGER,
  ADD COLUMN IF NOT EXISTS talk_time_sec         INTEGER,
  ADD COLUMN IF NOT EXISTS answered_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS client_answered_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS outcome               TEXT
    CONSTRAINT call_attempts_outcome_check
      CHECK (outcome IS NULL OR outcome IN (
        'contactado',
        'advisor_no_answer',
        'client_no_answer',
        'voicemail',
        'failed',
        'cancelled'
      )),
  ADD COLUMN IF NOT EXISTS recording_storage_path TEXT,
  -- Forward-compat AI columns — NO processing logic in this slice:
  ADD COLUMN IF NOT EXISTS transcript_text       TEXT,
  ADD COLUMN IF NOT EXISTS summary_text          TEXT,
  ADD COLUMN IF NOT EXISTS transcript_status     TEXT;

-- Helpful index for history page queries (asesor + date)
CREATE INDEX IF NOT EXISTS idx_call_attempts_asesor_date
  ON public.call_attempts(asesor_id, inicio_at DESC);
