-- ════════════════════════════════════════════════════════════════════════════
-- Cron: cotizacion-sweep — cada minuto, via pg_net + Vault
-- Reutiliza la extensión pg_cron/pg_net y el secreto 'call_engine_secret'
-- que ya existe (creado por 20260623140000_call_engine_cron.sql).
-- ════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $d$ BEGIN PERFORM cron.unschedule('cotizacion-sweep'); EXCEPTION WHEN OTHERS THEN NULL; END $d$;

SELECT cron.schedule('cotizacion-sweep', '* * * * *', $cron$
  SELECT net.http_post(
    url := 'https://bnpusllwkahhipllprpi.supabase.co/functions/v1/cotizacion-sweep',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'call_engine_secret')
    ),
    body := '{}'::jsonb
  );
$cron$);
