// kommo-note — write a note to a Kommo lead from the advisor cockpit.
// verify_jwt=true (Supabase validates the JWT before this handler runs).
// Gate: caller must be the asesor who owns the call_attempt (403 if mismatch).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  adminClient,
  getIntegracion,
  kommoAddNote,
} from "../_shared/integraciones.ts";
import type { KommoCfg } from "../_shared/integraciones.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = adminClient();

    // ── Resolve caller's asesor_id from JWT sub ──────────────────────────────
    const auth = req.headers.get("Authorization") ?? "";
    const jwt = auth.replace(/^Bearer\s+/i, "");
    if (!jwt || jwt.split(".").length !== 3) {
      return new Response(JSON.stringify({ ok: false, error: "No autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    let sub: string | null = null;
    try {
      const payload = JSON.parse(atob(jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      sub = payload.sub ?? null;
    } catch {
      return new Response(JSON.stringify({ ok: false, error: "JWT inválido" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up the caller in usuarios_sistema to get their asesor_id
    const { data: caller, error: callerErr } = await admin
      .from("usuarios_sistema")
      .select("asesor_id, rol, activo")
      .eq("user_id", sub!)
      .maybeSingle();

    if (callerErr || !caller || !caller.activo || caller.rol !== "asesor" || !caller.asesor_id) {
      return new Response(JSON.stringify({ ok: false, error: "No autorizado" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerAsesorId = caller.asesor_id as string;

    // ── Parse request body ───────────────────────────────────────────────────
    const body = await req.json() as {
      call_attempt_id: string;
      text: string;
    };
    const { call_attempt_id, text } = body;
    if (!call_attempt_id || !text?.trim()) {
      return new Response(JSON.stringify({ ok: false, error: "call_attempt_id y text son requeridos" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Verify ownership: attempt.asesor_id must match caller's asesor_id ────
    const { data: attempt, error: attemptErr } = await admin
      .from("call_attempts")
      .select("id, asesor_id, lead_id, call_queue_id")
      .eq("id", call_attempt_id)
      .maybeSingle();

    if (attemptErr || !attempt) {
      return new Response(JSON.stringify({ ok: false, error: "Intento no encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (attempt.asesor_id !== callerAsesorId) {
      return new Response(JSON.stringify({ ok: false, error: "No autorizado" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Resolve kommo_lead_id from call_queue ────────────────────────────────
    const { data: queueRow } = await admin
      .from("call_queue")
      .select("kommo_lead_id")
      .eq("id", attempt.call_queue_id)
      .maybeSingle();

    const kommoLeadId = queueRow?.kommo_lead_id as string | null;

    // ── Post note to Kommo (if configured and kommo_lead_id available) ───────
    if (kommoLeadId) {
      const kommoIntegracion = await getIntegracion(admin, "kommo");
      if (kommoIntegracion?.activo) {
        const kommoCfg = kommoIntegracion.config as unknown as KommoCfg;
        await kommoAddNote(kommoCfg, kommoLeadId, text.trim());
      }
    }

    // ── Persist note in call_attempts.notas ─────────────────────────────────
    await admin
      .from("call_attempts")
      .update({ notas: text.trim() })
      .eq("id", call_attempt_id);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("kommo-note error:", (e as Error).message);
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
