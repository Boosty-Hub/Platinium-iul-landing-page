// cotizacion-sweep — Detecta llamadas completadas (+2 min) y envía cotizaciones.
// Gate: x-internal-secret == INTERNAL_TASK_SECRET (disparado por pg_cron)
// verify_jwt=false
//
// Algoritmo:
//   1) call_attempts con estado='completed' AND lead.cotizacion_enviada_at IS NULL
//      AND client_answered_at < now() - 2min  (LIMIT 10)
//   2) Para cada: verifica en RC call-log que hubo una llamada outbound al
//      teléfono del lead dentro de ±15 min de client_answered_at con duration >= 120s.
//   3) Si pasa la verificación → sendCotizacion(admin, lead_id).
//   4) Si Resend no está configurado → retorno temprano (no loop-error).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, adminClient, getIntegracion } from "../_shared/integraciones.ts";
import { sendCotizacion } from "../_shared/cotizacion.ts";
import type { RCCfg } from "../_shared/integraciones.ts";
import { rcAuth } from "../_shared/integraciones.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// ── Verifica en RC call-log si existe llamada outbound con duration >= 120s ──
async function rcCallVerified(
  rc: RCCfg,
  token: string,
  toNumber: string,
  clientAnsweredAt: string,
): Promise<boolean> {
  try {
    const at = new Date(clientAnsweredAt);
    const from = new Date(at.getTime() - 15 * 60_000).toISOString();
    const to = new Date(at.getTime() + 15 * 60_000).toISOString();

    // Normalizar número (quitar non-digits, dejar solo dígitos para comparar)
    const normalize = (p: string) => p.replace(/\D/g, "").slice(-10);
    const targetDigits = normalize(toNumber);

    const url = new URL(`${rc.server_url}/restapi/v1.0/account/~/call-log`);
    url.searchParams.set("direction", "Outbound");
    url.searchParams.set("dateFrom", from);
    url.searchParams.set("dateTo", to);
    url.searchParams.set("perPage", "20");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.warn("cotizacion-sweep: RC call-log", res.status);
      return false;
    }
    const data = await res.json();
    const records = data?.records ?? [];
    for (const r of records) {
      const to_num: string = r?.to?.phoneNumber ?? "";
      const duration: number = r?.duration ?? 0;
      if (normalize(to_num) === targetDigits && duration >= 120) {
        return true;
      }
    }
    return false;
  } catch (e) {
    console.error("cotizacion-sweep: rcCallVerified error", e);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // ── Gate interno ──────────────────────────────────────────────────────────
  const secret = req.headers.get("x-internal-secret");
  const internalOk = !!secret && secret === Deno.env.get("INTERNAL_TASK_SECRET");
  if (!internalOk) {
    return json({ ok: false, error: "No autorizado" }, 403);
  }

  const admin = adminClient();

  // ── Verificar Resend activo antes de iterar ───────────────────────────────
  const resend = await getIntegracion(admin, "resend").catch(() => null);
  if (!resend?.activo || !resend.config?.api_key) {
    return json({ ok: true, skipped: "resend_no_config", processed: 0 });
  }

  // ── Cargar RC config para verificación de llamadas ────────────────────────
  const rcI = await getIntegracion(admin, "ringcentral").catch(() => null);
  const rc = rcI?.activo ? (rcI.config as unknown as RCCfg) : null;
  let rcToken: string | null = null;
  if (rc) {
    try { rcToken = await rcAuth(rc); } catch (e) {
      console.warn("cotizacion-sweep: RC auth failed", e);
    }
  }

  // ── Buscar intentos completados sin cotización enviada ─────────────────────
  // client_answered_at < now() - 2 min
  const cutoff = new Date(Date.now() - 2 * 60_000).toISOString();

  const { data: attempts, error: attErr } = await admin
    .from("call_attempts")
    .select(`
      id,
      lead_id,
      client_answered_at,
      leads!inner (
        id,
        telefono,
        cotizacion_enviada_at
      )
    `)
    .eq("estado", "completed")
    .lt("client_answered_at", cutoff)
    .is("leads.cotizacion_enviada_at", null)
    .limit(10);

  if (attErr) {
    console.error("cotizacion-sweep: query error", attErr.message);
    return json({ ok: false, error: attErr.message }, 200);
  }

  if (!attempts || attempts.length === 0) {
    return json({ ok: true, processed: 0 });
  }

  // ── Deduplicar por lead_id (puede haber varios intentos del mismo lead) ───
  const seen = new Set<string>();
  const toProcess: Array<{ lead_id: string; client_answered_at: string; telefono: string }> = [];
  for (const a of attempts) {
    const lid = a.lead_id as string;
    if (seen.has(lid)) continue;
    seen.add(lid);
    // leads puede ser array o single dependiendo de la join — manejar ambos
    const leadRow = Array.isArray(a.leads) ? a.leads[0] : a.leads;
    toProcess.push({
      lead_id: lid,
      client_answered_at: a.client_answered_at as string,
      telefono: (leadRow as { telefono?: string })?.telefono ?? "",
    });
  }

  const results: Array<{ lead_id: string; result: unknown }> = [];

  for (const item of toProcess) {
    // ── Verificar RC si está disponible ──────────────────────────────────
    if (rc && rcToken && item.telefono) {
      const verified = await rcCallVerified(rc, rcToken, item.telefono, item.client_answered_at);
      if (!verified) {
        results.push({ lead_id: item.lead_id, result: { skipped: "rc_call_not_verified" } });
        continue;
      }
    }
    // ── Enviar cotización ─────────────────────────────────────────────────
    try {
      const r = await sendCotizacion(admin, item.lead_id);
      results.push({ lead_id: item.lead_id, result: r });
    } catch (e) {
      console.error("cotizacion-sweep: sendCotizacion error", item.lead_id, e);
      results.push({ lead_id: item.lead_id, result: { ok: false, error: (e as Error).message } });
    }
  }

  return json({ ok: true, processed: results.length, results });
});
