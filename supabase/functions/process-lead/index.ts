import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders, adminClient, callerIsAdmin, procesarLead,
} from "../_shared/integraciones.ts";

// Reprocesa un lead manualmente (admin): crear en Kommo y/o llamar por RingCentral.
// Body: { lead_id: string, llamar?: boolean }
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const admin = adminClient();

  if (!(await callerIsAdmin(req, admin))) {
    return new Response(JSON.stringify({ ok: false, error: "No autorizado" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const { lead_id, llamar } = await req.json();
    if (!lead_id) throw new Error("Falta 'lead_id'.");

    const { data: lead, error } = await admin
      .from("leads")
      .select("id, nombre, telefono, email, interes")
      .eq("id", lead_id)
      .maybeSingle();
    if (error || !lead) throw new Error("Lead no encontrado.");

    const result = await procesarLead(admin, lead as any, { llamar: llamar ?? true });
    return new Response(JSON.stringify({ ok: true, lead_id, ...result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: (err as Error).message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
