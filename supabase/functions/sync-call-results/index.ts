// sync-call-results — concilia el call-log REAL de RingCentral con call_attempts.
//
// En el modelo click-to-call el softphone del asesor marca al cliente y RingCentral
// es la ÚNICA fuente de verdad de si la llamada conectó, cuánto duró y la grabación.
// Nuestro sistema no lo capturaba (0 de 832 intentos tenían duración/grabación).
//
// Este sweep (pg_cron, cada minuto):
//   1) Baja el call-log de cuenta (Outbound, Detailed, withRecording) de los últimos
//      ~90 min.
//   2) Matchea cada llamada a un call_attempt por (teléfono del cliente + ventana de
//      tiempo), prefiriendo el asesor cuyo nombre coincide con from.name.
//   3) Sella el intento con datos REALES: rc_session_id, rc_result, duracion_seg,
//      talk_time_sec y rc_call_start. NO pisa la disposición del asesor (outcome).
//   4) Si la llamada tiene grabación, la baja y la guarda en el bucket privado.
//
// Gate: x-internal-secret (mismo Vault secret que process-call-queue).
// verify_jwt=false — lo invoca pg_cron vía pg_net.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, adminClient, getIntegracion, rcAuth } from "../_shared/integraciones.ts";
import type { RCCfg } from "../_shared/integraciones.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// Normaliza a E.164-ish para comparar (mismo criterio que el motor).
function norm(p?: string | null): string | null {
  if (!p) return null;
  const t = String(p).trim();
  if (t.startsWith("+")) return "+" + t.slice(1).replace(/\D/g, "");
  const d = t.replace(/\D/g, "");
  if (d.length === 10) return "+1" + d;
  if (d.length === 11 && d.startsWith("1")) return "+" + d;
  return d ? "+" + d : null;
}

// Resultados de RC que implican voz real con el cliente (cuenta como talk time).
const CONNECTED = new Set(["Call connected", "Accepted"]);

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const secret = req.headers.get("x-internal-secret");
  if (!secret || secret !== Deno.env.get("INTERNAL_TASK_SECRET")) return json({ ok: false, error: "No autorizado" }, 403);

  const admin = adminClient();
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const WINDOW_MIN = Math.min(Math.max(Number((body as { minutes?: number }).minutes) || 90, 5), 43200); // override p/ backfill (hasta 30 días)
  const MAX_RECORDINGS_BODY = Number((body as { maxRecordings?: number }).maxRecordings) || 0;
  const MATCH_TOLERANCE_MS = 6 * 60_000; // ±6 min entre el intento y el inicio RC
  const MAX_RECORDINGS = MAX_RECORDINGS_BODY > 0 ? MAX_RECORDINGS_BODY : 8; // tope de grabaciones por corrida

  try {
    const rcI = await getIntegracion(admin, "ringcentral");
    if (!rcI?.activo) return json({ ok: false, error: "RingCentral inactivo" });
    const rc = rcI.config as unknown as RCCfg;
    const token = await rcAuth(rc);

    // ── 1) Call-log de cuenta — PAGINADO (Outbound, Detallado, con grabación) ──
    // Para backfill: maxPages>1 sigue navigation.nextPage. El call-log de RC tiene
    // rate-limit agresivo (CMN-301); si pega 429 cortamos y seguimos en la próxima
    // corrida (idempotente, no se pierde nada).
    const dateFrom = new Date(Date.now() - WINDOW_MIN * 60_000).toISOString();
    const MAX_PAGES = Math.min(Math.max(Number((body as { maxPages?: number }).maxPages) || 1, 1), 12);
    let pageUrl: string | null = `${rc.server_url}/restapi/v1.0/account/~/call-log?direction=Outbound&view=Detailed&withRecording=true&perPage=250&dateFrom=${encodeURIComponent(dateFrom)}`;
    const records: Array<Record<string, any>> = [];
    let rateLimited = false;
    for (let p = 0; p < MAX_PAGES && pageUrl; p++) {
      const logRes = await fetch(pageUrl, { headers: { Authorization: `Bearer ${token}` } });
      if (logRes.status === 429) { rateLimited = true; break; }
      if (!logRes.ok) {
        if (records.length) break;
        return json({ ok: false, error: `call-log ${logRes.status}: ${(await logRes.text()).slice(0, 200)}` });
      }
      const data = await logRes.json();
      records.push(...((data?.records ?? []) as Array<Record<string, any>>));
      pageUrl = (data?.navigation?.nextPage?.uri as string | undefined) ?? null;
    }

    // ── 2) Intentos candidatos: SOLO los que REALMENTE marcaron al cliente ─────
    // advisor_answered (aceptó → softphone marcó) o tipo='direct' (llamada manual).
    // Un 'no_answer' (el asesor no aceptó) NUNCA marcó → no debe matchear ninguna
    // llamada de RC (si no, una llamada real de otro asesor se le atribuye falso).
    const winStart = new Date(Date.now() - (WINDOW_MIN + 15) * 60_000).toISOString();
    const { data: attempts } = await admin
      .from("call_attempts")
      .select("id, asesor_id, inicio_at, answered_at, estado, tipo, lead_id, asesores(nombre), leads(telefono)")
      .is("rc_session_id", null)
      .gte("inicio_at", winStart)
      .or("estado.in.(advisor_answered,client_answered,completed),tipo.eq.direct")
      .limit(3000);

    // Mapa teléfono-cliente normalizado → lista de intentos
    const byPhone = new Map<string, Array<any>>();
    for (const a of attempts ?? []) {
      const tel = norm((a.leads as { telefono?: string } | null)?.telefono ?? null);
      if (!tel) continue;
      let arr = byPhone.get(tel);
      if (!arr) { arr = []; byPhone.set(tel, arr); }
      arr.push(a);
    }

    // Idempotencia entre corridas: una llamada RC ya conciliada NO se vuelve a tocar
    // (si no, en otra corrida podría matchear a otro intento del mismo cliente).
    const sid = (rec: Record<string, any>) => String(rec.telephonySessionId ?? rec.sessionId ?? rec.id);
    const sessionIds = [...new Set(records.map(sid))];
    const synced = new Set<string>();
    for (let i = 0; i < sessionIds.length; i += 100) {
      const { data: ya } = await admin.from("call_attempts").select("rc_session_id").in("rc_session_id", sessionIds.slice(i, i + 100));
      for (const r of ya ?? []) if (r.rc_session_id) synced.add(r.rc_session_id as string);
    }

    const matched: Array<{ attempt: any; rec: Record<string, any> }> = [];
    const usedAttemptIds = new Set<string>();

    // RC primero los más nuevos; matcheamos cada llamada a su intento más cercano.
    for (const rec of records) {
      if (synced.has(sid(rec))) continue; // ya conciliada en una corrida previa
      const to = norm(rec?.to?.phoneNumber);
      if (!to || !rec.startTime) continue;
      const cands = (byPhone.get(to) ?? []).filter((a) => !usedAttemptIds.has(a.id));
      if (!cands.length) continue;

      const start = new Date(rec.startTime).getTime();
      const fromName = (rec?.from?.name ?? "").trim().toLowerCase();
      let best: any = null;
      let bestScore = Infinity;
      for (const a of cands) {
        const anchor = new Date((a.answered_at ?? a.inicio_at) as string).getTime();
        const dt = Math.abs(anchor - start);
        if (dt > MATCH_TOLERANCE_MS) continue;
        // Penaliza si el asesor no coincide (pero igual permite match por tiempo).
        const aName = ((a.asesores as { nombre?: string } | null)?.nombre ?? "").trim().toLowerCase();
        const score = dt + (fromName && aName && fromName !== aName ? 90_000 : 0);
        if (score < bestScore) { bestScore = score; best = a; }
      }
      if (best) { usedAttemptIds.add(best.id); matched.push({ attempt: best, rec }); }
    }

    // ── 3) Sellar telemetría + auto-clasificar ────────────────────────────────
    // Regla del negocio: una llamada conectada de +2 min ES un contacto real (aunque
    // la asesora la haya marcado "no contestó"). Marcamos el intento 'contactado' y,
    // si el lead seguía como "no contactado", lo corregimos.
    const CONTACT_SEC = 120;
    let sellados = 0, contactados = 0;
    for (const { attempt, rec } of matched) {
      const result = (rec.result as string) ?? null;
      const dur = Number(rec.duration ?? 0) || 0;
      const connected = CONNECTED.has(result ?? "");
      const esContacto = connected && dur >= CONTACT_SEC;
      const patch: Record<string, unknown> = {
        rc_session_id: String(rec.telephonySessionId ?? rec.sessionId ?? rec.id),
        rc_call_start: rec.startTime ?? null,
        rc_result: result,
        duracion_seg: dur,
        talk_time_sec: connected ? dur : 0,
        recording_id: rec?.recording?.id ? String(rec.recording.id) : null,
      };
      if (esContacto) { patch.outcome = "contactado"; patch.client_answered_at = rec.startTime ?? null; }
      const { error: upErr } = await admin.from("call_attempts").update(patch).eq("id", attempt.id);
      if (upErr) { console.error("sync-call-results telemetry update:", upErr.message); continue; }
      sellados++;
      if (esContacto) {
        contactados++;
        // Corrige el lead si seguía marcado "no contactado": SÍ se le contactó.
        await admin.from("call_queue").update({ estado: "contactado", ultimo_resultado: "contactado_rc_2min" })
          .eq("lead_id", attempt.lead_id).eq("estado", "no_contactado");
        await admin.from("leads").update({ disposicion_actual: "contactado" })
          .eq("id", attempt.lead_id).is("disposicion_actual", null);
      }
    }

    // ── 4) Bajar grabaciones — DESACOPLADO del sellado y reintentable ──────────
    // Toma intentos que ya tienen recording_id pero aún no la grabación guardada
    // (de esta corrida o de corridas previas). El contentUri se construye desde el
    // recording_id, así que el cron las va completando aunque sean muchas.
    const { data: pend } = await admin
      .from("call_attempts")
      .select("id, asesor_id, recording_id")
      .not("recording_id", "is", null)
      .is("recording_storage_path", null)
      .order("inicio_at", { ascending: false })
      .limit(MAX_RECORDINGS);
    let grabadas = 0;
    for (const g of pend ?? []) {
      try {
        const cu = `${rc.server_url}/restapi/v1.0/account/~/recording/${g.recording_id}/content`;
        const audioRes = await fetch(cu, { headers: { Authorization: `Bearer ${token}` } });
        if (!audioRes.ok) continue; // contentUri tarda 1–2 min post-llamada; reintenta el próximo sweep
        const buf = await audioRes.arrayBuffer();
        const path = `${g.asesor_id ?? "sin-asesor"}/${g.id}.mp3`;
        const { error: upErr } = await admin.storage.from("call-recordings").upload(path, buf, { contentType: "audio/mpeg", upsert: true });
        if (upErr) { console.error("sync-call-results upload", upErr.message); continue; }
        await admin.from("call_attempts").update({ recording_storage_path: path }).eq("id", g.id);
        grabadas++;
      } catch (e) { console.error("sync-call-results recording", (e as Error).message); }
    }

    return json({ ok: true, rc_records: records.length, candidatos: attempts?.length ?? 0, sellados, contactados, grabadas, rate_limited: rateLimited });
  } catch (e) {
    console.error("sync-call-results fatal:", (e as Error).message);
    return json({ ok: false, error: (e as Error).message }, 500);
  }
});
