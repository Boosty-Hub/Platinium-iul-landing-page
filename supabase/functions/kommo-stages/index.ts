// kommo-stages — returns the pipeline stages for the configured Kommo pipeline.
// Accessible to both asesores and admins (read-only, no write to Kommo).
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

  // ── JWT gate: must be an active asesor OR admin ──────────────────────────────
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
    .select("rol, activo")
    .eq("user_id", sub!)
    .maybeSingle();

  if (
    callerErr ||
    !caller ||
    !caller.activo ||
    (caller.rol !== "asesor" && caller.rol !== "admin")
  ) {
    return new Response(JSON.stringify({ ok: false, error: "No autorizado" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

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

  // ── Fetch pipelines from Kommo ───────────────────────────────────────────────
  try {
    const pipelinesRes = await fetch(
      `https://${cfg.subdominio}.kommo.com/api/v4/leads/pipelines`,
      {
        headers: { Authorization: `Bearer ${cfg.access_token}` },
      },
    );

    if (!pipelinesRes.ok) {
      const txt = await pipelinesRes.text();
      throw new Error(`Kommo pipelines ${pipelinesRes.status}: ${txt.slice(0, 300)}`);
    }

    const pipelinesData = await pipelinesRes.json();
    const pipelines: Array<{
      id: number;
      name: string;
      _embedded?: { statuses?: Array<{ id: number; name: string }> };
    }> = pipelinesData?._embedded?.pipelines ?? [];

    // Find the configured pipeline
    const targetId = Number(cfg.pipeline_id);
    const pipeline = pipelines.find((p) => p.id === targetId) ?? null;

    const stages = pipeline
      ? (pipeline._embedded?.statuses ?? []).map((s) => ({
          id: s.id,
          name: s.name,
        }))
      : [];

    return new Response(
      JSON.stringify({ ok: true, stages }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
