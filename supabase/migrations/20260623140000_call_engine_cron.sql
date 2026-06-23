-- ════════════════════════════════════════════════════════════════════════════
-- lead-call-automation — Motor: disparador periódico (pg_cron + pg_net)
-- Cada minuto invoca la edge function process-call-queue con el secreto interno
-- (guardado en Vault como 'call_engine_secret'). El secreto NO vive en este
-- archivo: se crea aparte con vault.create_secret(...).
-- ════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $d$ BEGIN PERFORM cron.unschedule('call-engine'); EXCEPTION WHEN OTHERS THEN NULL; END $d$;

SELECT cron.schedule('call-engine', '* * * * *', $cron$
  SELECT net.http_post(
    url := 'https://bnpusllwkahhipllprpi.supabase.co/functions/v1/process-call-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'call_engine_secret')
    ),
    body := '{"maxItems":3}'::jsonb
  );
$cron$);
