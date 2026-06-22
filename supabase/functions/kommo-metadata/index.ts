import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders, adminClient, callerIsAdmin, getIntegracion, kommoMetadata, type KommoCfg,
} from "../_shared/integraciones.ts";

// Devuelve pipelines+etapas, usuarios y custom fields de Kommo para poblar
// los dropdowns del dashboard SIN que el usuario maneje IDs. Admin-gated.
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
    const row = await getIntegracion(admin, "kommo");
    if (!row?.config?.access_token || !row?.config?.subdominio) {
      throw new Error("Configurá primero el subdominio y el token de Kommo.");
    }
    const meta = await kommoMetadata(row.config as unknown as KommoCfg);
    return new Response(JSON.stringify({ ok: true, ...meta }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: (err as Error).message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
