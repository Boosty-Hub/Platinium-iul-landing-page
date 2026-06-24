// lead-history — devuelve el historial cronológico unificado de un lead.
//
// verify_jwt=true (Supabase valida la firma antes de llegar aquí).
// Gate: admin ó asesor que es owner del lead en call_queue.
//
// Body: { lead_id }
// Respuesta: { ok, lead, timeline } ó { ok:false, error }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, adminClient, callerIsAdmin } from "../_shared/integraciones.ts";
import { getLeadHistory } from "../_shared/seguimiento.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const admin = adminClient();

  // ── JWT gate ───────────────────────────────────────────────────────────────
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

  const { data: caller } = await admin
    .from("usuarios_sistema")
    .select("rol, activo, asesor_id")
    .eq("user_id", sub!)
    .maybeSingle();

  if (!caller || !caller.activo) {
    return new Response(JSON.stringify({ ok: false, error: "No autorizado" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const isAdminUser = caller.rol === "admin";
  const callerAsesorId = caller.rol === "asesor" ? (caller.asesor_id as string | null) : null;

  if (!isAdminUser && !callerAsesorId) {
    return new Response(JSON.stringify({ ok: false, error: "No autorizado" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: { lead_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Body JSON inválido" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { lead_id } = body;
  if (!lead_id) {
    return new Response(JSON.stringify({ ok: false, error: "Falta lead_id" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Ownership check (asesor) ───────────────────────────────────────────────
  if (!isAdminUser) {
    const { data: qRow } = await admin
      .from("call_queue")
      .select("asesor_id, solo_asesor_id")
      .eq("lead_id", lead_id)
      .maybeSingle();

    const ownsLead =
      qRow?.asesor_id === callerAsesorId ||
      qRow?.solo_asesor_id === callerAsesorId;

    if (!ownsLead) {
      return new Response(
        JSON.stringify({ ok: false, error: "Este lead no está asignado a tu cuenta." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  }

  // ── Build history ──────────────────────────────────────────────────────────
  const result = await getLeadHistory(admin, lead_id);

  if ("error" in result) {
    return new Response(JSON.stringify({ ok: false, error: result.error }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, ...result }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
