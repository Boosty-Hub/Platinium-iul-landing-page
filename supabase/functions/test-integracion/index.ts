import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders, adminClient, callerIsAdmin, getIntegracion,
  kommoTest, rcAuth, type KommoCfg, type RCCfg,
} from "../_shared/integraciones.ts";

// Prueba la conexión de una integración SIN efectos secundarios.
// Kommo: lee la cuenta. RingCentral: autentica (no realiza llamada).
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
    const { clave } = await req.json();
    if (!clave) throw new Error("Falta 'clave'.");

    const row = await getIntegracion(admin, clave);
    if (!row) throw new Error(`Integración '${clave}' no encontrada.`);
    const cfg = row.config ?? {};

    let info: Record<string, unknown>;
    if (clave === "kommo") {
      const acc = await kommoTest(cfg as unknown as KommoCfg);
      info = { mensaje: `Conectado a Kommo: ${acc.name} (${acc.subdomain}.kommo.com)`, cuenta: acc };
    } else if (clave === "ringcentral") {
      await rcAuth(cfg as unknown as RCCfg);
      info = { mensaje: "Autenticación con RingCentral correcta (no se realizó ninguna llamada)." };
    } else {
      throw new Error(`No hay prueba para '${clave}'.`);
    }

    return new Response(JSON.stringify({ ok: true, clave, ...info }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: (err as Error).message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
