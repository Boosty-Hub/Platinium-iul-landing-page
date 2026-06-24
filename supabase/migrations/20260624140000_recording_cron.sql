-- ════════════════════════════════════════════════════════════════════════════
-- Slice 3: pg_cron sweep for process-recording edge function.
-- Runs every 2 minutes; mirrors the pattern of 20260623140000_call_engine_cron.sql.
-- Reuses the existing Vault secret 'call_engine_secret' (same internal secret).
-- ════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Unschedule any previous version (idempotent)
DO $d$ BEGIN PERFORM cron.unschedule('process-recordings-sweep'); EXCEPTION WHEN OTHERS THEN NULL; END $d$;

SELECT cron.schedule('process-recordings-sweep', '*/2 * * * *', $cron$
  SELECT net.http_post(
    url := 'https://bnpusllwkahhipllprpi.supabase.co/functions/v1/process-recording',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'call_engine_secret')
    ),
    body := '{}'::jsonb
  );
$cron$);
