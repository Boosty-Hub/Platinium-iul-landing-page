// asesor-update-stage — moves a lead's Kommo stage on behalf of an asesor.
// The asesor must own the lead in call_queue.
// verify_jwt=true (Supabase validates the JWT before this handler runs).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  adminClient,
  getIntegracion,
} from "../_shared/integraciones.ts";
import type { KommoCfg } from "../_shared/integraciones.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const admin = adminClient();

  // ── JWT gate: must be an active asesor ──────────────────────────────────────
  const auth = req.headers.get("Authorization") ?? "";
  const jwt = auth.replace(/^Bearer\s+/i, "");
  if (!jwt || jwt.split(".").length !== 3) {
    return new Response(JSON.stringify({ ok: false, error: "No autorizado" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let sub: string | null = null;
  try {
    const payload = JSON.parse(
      atob(jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    sub = payload.sub ?? null;
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "JWT inválido" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: caller, error: callerErr } = await admin
    .from("usuarios_sistema")
    .select("asesor_id, rol, activo")
    .eq("user_id", sub!)
    .maybeSingle();

  if (
    callerErr ||
    !caller ||
    !caller.activo ||
    caller.rol !== "asesor" ||
    !caller.asesor_id
  ) {
    return new Response(JSON.stringify({ ok: false, error: "No autorizado" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const callerAsesorId = caller.asesor_id as string;

  // ── Parse body ───────────────────────────────────────────────────────────────
  let body: { lead_id?: string; status_id?: number };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: "Body JSON inválido" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  if (!body.lead_id || body.status_id == null) {
    return new Response(
      JSON.stringify({ ok: false, error: "Faltan campos: lead_id, status_id" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const { lead_id, status_id } = body;

  // ── Verify ownership ─────────────────────────────────────────────────────────
  const { data: queueRow, error: queueErr } = await admin
    .from("call_queue")
    .select("id, kommo_lead_id")
    .eq("lead_id", lead_id)
    .eq("asesor_id", callerAsesorId)
    .maybeSingle();

  if (queueErr || !queueRow) {
    return new Response(
      JSON.stringify({ ok: false, error: "Ese lead no es tuyo" }),
      {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // ── Check Kommo lead ID ───────────────────────────────────────────────────────
  if (!queueRow.kommo_lead_id) {
    return new Response(
      JSON.stringify({ ok: false, error: "Sin lead en Kommo" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const kommoLeadId = queueRow.kommo_lead_id as string;

  // ── Load Kommo config ─────────────────────────────────────────────────────────
  const kommo = await getIntegracion(admin, "kommo");
  if (!kommo?.activo) {
    return new Response(
      JSON.stringify({ ok: false, error: "Kommo no está activo" }),
      {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const cfg = kommo.config as unknown as KommoCfg;

  // ── PATCH Kommo lead stage ────────────────────────────────────────────────────
  try {
    const patchRes = await fetch(
      `https://${cfg.subdominio}.kommo.com/api/v4/leads/${kommoLeadId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${cfg.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status_id: Number(status_id),
          pipeline_id: Number(cfg.pipeline_id),
        }),
      },
    );

    if (!patchRes.ok) {
      const txt = await patchRes.text();
      throw new Error(`Kommo PATCH ${patchRes.status}: ${txt.slice(0, 300)}`);
    }
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  return new Response(
    JSON.stringify({ ok: true }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
