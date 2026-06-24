// send-cotizacion — Envía la cotización de póliza por email a un lead.
// Gate (verify_jwt=false porque el cron lo llama sin JWT):
//   · x-internal-secret == INTERNAL_TASK_SECRET  → llamada interna (cron)
//   · ó un usuario cuyo JWT se VERIFICA con auth.getUser (firma + expiración):
//       - admin: permitido
//       - asesor: debe "poseer" el lead (call_queue.asesor_id)
// NO se confía en el `sub` decodificado a mano (eso sería bypass con JWT forjado).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, adminClient } from "../_shared/integraciones.ts";
import { sendCotizacion } from "../_shared/cotizacion.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Verifica la FIRMA del JWT contra GoTrue y devuelve el user_id de confianza.
async function verifiedUserId(
  req: Request,
  admin: ReturnType<typeof adminClient>,
): Promise<string | null> {
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt || jwt.split(".").length !== 3) return null;
  const { data, error } = await admin.auth.getUser(jwt);
  if (error || !data?.user) return null;
  return data.user.id;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = adminClient();

  const secret = req.headers.get("x-internal-secret");
  const internalOk = !!secret && secret === Deno.env.get("INTERNAL_TASK_SECRET");

  let body: { lead_id?: string; monto?: number } = {};
  try { body = await req.json(); } catch { /* ignore */ }
  const lead_id = body.lead_id;
  if (!lead_id) return json({ ok: false, error: "lead_id requerido" }, 200);

  // ── Gate de usuario (si no es llamada interna) ─────────────────────────────
  if (!internalOk) {
    const userId = await verifiedUserId(req, admin);
    if (!userId) return json({ ok: false, error: "No autorizado" }, 401);

    const { data: us } = await admin
      .from("usuarios_sistema")
      .select("rol, activo, asesor_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!us || !us.activo) return json({ ok: false, error: "No autorizado" }, 403);

    if (us.rol !== "admin") {
      // asesor: debe poseer el lead
      if (us.rol !== "asesor" || !us.asesor_id) return json({ ok: false, error: "No autorizado" }, 403);
      const { data: cq } = await admin
        .from("call_queue")
        .select("id")
        .eq("lead_id", lead_id)
        .eq("asesor_id", us.asesor_id)
        .maybeSingle();
      if (!cq) return json({ ok: false, error: "Este lead no está asignado a tu cuenta." }, 403);
    }
  }

  // ── Ejecutar ──────────────────────────────────────────────────────────────
  try {
    const result = await sendCotizacion(admin, lead_id, body.monto);
    return json(result, 200);
  } catch (e) {
    console.error("send-cotizacion error:", e);
    return json({ ok: false, error: (e as Error).message }, 200);
  }
});
