// asesor-call-lead — initiates a RingCentral ring-out from the asesor's own phone
// to the lead's phone. The asesor must own the lead in call_queue.
// verify_jwt=true (Supabase validates the JWT before this handler runs).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  adminClient,
  getIntegracion,
  rcAuth,
} from "../_shared/integraciones.ts";
import type { RCCfg } from "../_shared/integraciones.ts";

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
  let body: { lead_id?: string };
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

  if (!body.lead_id) {
    return new Response(
      JSON.stringify({ ok: false, error: "Falta lead_id" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const { lead_id } = body;

  // ── Verify ownership: lead must be in caller's queue ─────────────────────────
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

  // ── Get asesor's phone ────────────────────────────────────────────────────────
  const { data: asesor, error: asesorErr } = await admin
    .from("asesores")
    .select("telefono")
    .eq("id", callerAsesorId)
    .maybeSingle();

  if (asesorErr || !asesor?.telefono) {
    return new Response(
      JSON.stringify({ ok: false, error: "El asesor no tiene teléfono configurado" }),
      {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // ── Get lead's phone ──────────────────────────────────────────────────────────
  const { data: lead, error: leadErr } = await admin
    .from("leads")
    .select("telefono")
    .eq("id", lead_id)
    .maybeSingle();

  if (leadErr || !lead?.telefono) {
    return new Response(
      JSON.stringify({ ok: false, error: "El lead no tiene teléfono" }),
      {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // ── Load RC config ────────────────────────────────────────────────────────────
  const rc = await getIntegracion(admin, "ringcentral");
  if (!rc?.activo) {
    return new Response(
      JSON.stringify({ ok: false, error: "RingCentral no está activo" }),
      {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const cfg = rc.config as unknown as RCCfg;

  // ── Authenticate with RC and initiate ring-out ────────────────────────────────
  // We use the asesor's own telefono as the "from" number (not cfg.from_number).
  // The RC token is kept strictly server-side and never returned to the client.
  let ringoutId: string | null = null;
  let callStatus = "Unknown";

  try {
    const token = await rcAuth(cfg);

    const ringoutRes = await fetch(
      `${cfg.server_url}/restapi/v1.0/account/~/extension/~/ring-out`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: { phoneNumber: asesor.telefono },
          to: { phoneNumber: lead.telefono },
          playPrompt: false,
        }),
      },
    );

    const ringoutTxt = await ringoutRes.text();
    if (!ringoutRes.ok) {
      throw new Error(`RingOut ${ringoutRes.status}: ${ringoutTxt.slice(0, 300)}`);
    }

    const ringoutData = JSON.parse(ringoutTxt);
    ringoutId = ringoutData?.id ?? null;
    callStatus = ringoutData?.status?.callStatus ?? "Unknown";
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // ── Record the attempt (best-effort; ring-out already happened) ───────────────
  try {
    await admin.from("call_attempts").insert({
      call_queue_id: queueRow.id,
      lead_id,
      asesor_id: callerAsesorId,
      tipo: "direct",
      rc_ringout_id: ringoutId,
      estado: "initiated",
      inicio_at: new Date().toISOString(),
    }).select("id").single();
  } catch (e) {
    console.error("asesor-call-lead/insert_attempt:", (e as Error).message);
    // Do not abort — the ring-out already happened.
  }

  return new Response(
    JSON.stringify({ ok: true, status: callStatus }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
