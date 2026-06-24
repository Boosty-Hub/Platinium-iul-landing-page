// process-recording — async sweep: fetch RC recordings for completed call_attempts
// and store them in the private 'call-recordings' Storage bucket.
//
// Gate: x-internal-secret (same Vault secret as process-call-queue).
// verify_jwt=false — invoked by pg_cron via pg_net (no JWT).
// RC token is NEVER returned in any response.
//
// Retry tolerance: RC recording ContentUri lags 1–2 min post-call.
// The sweep tolerates "no recording yet" by skipping gracefully; pg_cron
// retries every 2 min.  After 10 failed fetch attempts the row is skipped
// permanently (recording unavailable) to avoid infinite retries.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, adminClient, getIntegracion, rcAuth } from "../_shared/integraciones.ts";
import type { RCCfg } from "../_shared/integraciones.ts";

const MAX_FETCH_ATTEMPTS = 10;
const COMPLETED_DELAY_SEC = 90;  // only sweep attempts finished > 90s ago

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // ── Gate: x-internal-secret ───────────────────────────────────────────────
  const secret = req.headers.get("x-internal-secret");
  const internalOk = !!secret && secret === Deno.env.get("INTERNAL_TASK_SECRET");
  if (!internalOk) {
    return json({ ok: false, error: "No autorizado" }, 403);
  }

  const admin = adminClient();

  try {
    // ── 1. Find up to 10 completed attempts missing a recording ───────────────
    const cutoff = new Date(Date.now() - COMPLETED_DELAY_SEC * 1000).toISOString();

    const { data: attempts, error: fetchErr } = await admin
      .from("call_attempts")
      .select("id, asesor_id, rc_ringout_id, fin_at, recording_fetch_attempts")
      .eq("estado", "completed")
      .is("recording_storage_path", null)
      .lt("fin_at", cutoff)
      .lt("recording_fetch_attempts", MAX_FETCH_ATTEMPTS)
      .order("fin_at", { ascending: true })
      .limit(10);

    if (fetchErr) throw fetchErr;
    if (!attempts || attempts.length === 0) {
      return json({ ok: true, processed: 0, message: "No pending recordings" });
    }

    // ── 2. Load RingCentral config once ────────────────────────────────────────
    const rcIntegracion = await getIntegracion(admin, "ringcentral");
    if (!rcIntegracion?.activo) {
      return json({ ok: false, error: "RingCentral no configurado o inactivo" });
    }
    const rcCfg = rcIntegracion.config as unknown as RCCfg;

    let rcToken: string | null = null;
    try {
      rcToken = await rcAuth(rcCfg);
    } catch (e) {
      console.error("process-recording: rcAuth failed:", (e as Error).message);
      return json({ ok: false, error: "RC auth failed: " + (e as Error).message });
    }

    let processed = 0;
    const errors: string[] = [];

    for (const attempt of attempts) {
      const { id: attemptId, asesor_id, rc_ringout_id, fin_at } = attempt;
      const fetchAttempts = (attempt.recording_fetch_attempts as number) ?? 0;

      // Always increment the fetch attempt counter regardless of outcome
      await admin
        .from("call_attempts")
        .update({ recording_fetch_attempts: fetchAttempts + 1 })
        .eq("id", attemptId);

      try {
        // ── 3. Query RC call-log to find the recording for this attempt ─────────
        // Window: [fin_at - 5 min, fin_at + 2 min] to account for clock skew
        const finTime = new Date(fin_at as string);
        const dateFrom = new Date(finTime.getTime() - 5 * 60_000).toISOString();
        const dateTo   = new Date(finTime.getTime() + 2 * 60_000).toISOString();

        const callLogUrl = new URL(
          `${rcCfg.server_url}/restapi/v1.0/account/~/call-log`
        );
        callLogUrl.searchParams.set("view", "Detailed");
        callLogUrl.searchParams.set("dateFrom", dateFrom);
        callLogUrl.searchParams.set("dateTo", dateTo);
        callLogUrl.searchParams.set("withRecording", "true");
        callLogUrl.searchParams.set("perPage", "50");
        callLogUrl.searchParams.set("type", "Voice");

        const logRes = await fetch(callLogUrl.toString(), {
          headers: { Authorization: `Bearer ${rcToken}` },
        });

        if (!logRes.ok) {
          const txt = await logRes.text();
          console.warn(`process-recording [${attemptId}]: call-log ${logRes.status}: ${txt.slice(0, 200)}`);
          errors.push(`${attemptId}: call-log ${logRes.status}`);
          continue;
        }

        const logData = await logRes.json();
        const records: Array<Record<string, unknown>> = logData?.records ?? [];

        // Find a record that matches our ringout ID or has a recording
        let recordingId: string | null = null;
        let contentUri: string | null = null;

        for (const rec of records) {
          const recId = (rec as any)?.recording?.id;
          const uri   = (rec as any)?.recording?.contentUri;

          // Match by sessionId or by ringoutId if present, or just take first with recording
          if (rc_ringout_id && (rec as any)?.sessionId === rc_ringout_id) {
            recordingId = recId ?? null;
            contentUri  = uri  ?? null;
            break;
          }
          // Fallback: first record that has a recording in the time window
          if (!recordingId && recId && uri) {
            recordingId = recId;
            contentUri  = uri;
          }
        }

        if (!contentUri) {
          // Recording not yet available — will retry next sweep
          console.log(`process-recording [${attemptId}]: no recording URI yet (attempt ${fetchAttempts + 1})`);
          continue;
        }

        // ── 4. Fetch the audio content from RC (contentUri uses RC media host) ──
        const audioRes = await fetch(contentUri, {
          headers: { Authorization: `Bearer ${rcToken}` },
        });

        if (!audioRes.ok) {
          console.warn(`process-recording [${attemptId}]: audio fetch ${audioRes.status}`);
          errors.push(`${attemptId}: audio fetch ${audioRes.status}`);
          continue;
        }

        const audioBuffer = await audioRes.arrayBuffer();

        // ── 5. Upload to private bucket ────────────────────────────────────────
        const storagePath = `${asesor_id}/${attemptId}.mp3`;

        const { error: uploadErr } = await admin.storage
          .from("call-recordings")
          .upload(storagePath, audioBuffer, {
            contentType: "audio/mpeg",
            upsert: true,
          });

        if (uploadErr) {
          console.error(`process-recording [${attemptId}]: upload error:`, uploadErr.message);
          errors.push(`${attemptId}: upload ${uploadErr.message}`);
          continue;
        }

        // ── 6. Update call_attempts with storage path + RC recording ID ─────────
        await admin
          .from("call_attempts")
          .update({
            recording_storage_path: storagePath,
            recording_id: recordingId,
          })
          .eq("id", attemptId);

        console.log(`process-recording [${attemptId}]: stored at ${storagePath}`);
        processed++;
      } catch (e) {
        console.error(`process-recording [${attemptId}]: unexpected error:`, (e as Error).message);
        errors.push(`${attemptId}: ${(e as Error).message}`);
      }
    }

    return json({
      ok: true,
      processed,
      checked: attempts.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (e) {
    console.error("process-recording: fatal error:", (e as Error).message);
    return json({ ok: false, error: (e as Error).message }, 500);
  }
});
