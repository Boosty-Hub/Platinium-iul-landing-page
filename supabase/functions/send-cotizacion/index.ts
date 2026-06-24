// send-cotizacion — Envía la cotización de póliza por email a un lead.
// Gate: x-internal-secret == INTERNAL_TASK_SECRET
//    OR callerIsAdmin
//    OR asesor autenticado que "posee" el lead (via call_queue.asesor_id)
// verify_jwt=false (acepta llamadas internas sin JWT)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, adminClient, callerIsAdmin } from "../_shared/integraciones.ts";
import { sendCotizacion } from "../_shared/cotizacion.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function callerIsAsesorOwner(
  req: Request,
  admin: ReturnType<typeof adminClient>,
  lead_id: string,
): Promise<boolean> {
  const auth = req.headers.get("Authorization") ?? "";
  const jwt = auth.replace(/^Bearer\s+/i, "");
  if (!jwt || jwt.split(".").length !== 3) return false;
  let sub: string | null = null;
  try {
    const payload = JSON.parse(
      atob(jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    sub = payload.sub ?? null;
  } catch {
    return false;
  }
  if (!sub) return false;

  // Obtener asesor_id del usuario autenticado
  const { data: us } = await admin
    .from("usuarios_sistema")
    .select("asesor_id, rol, activo")
    .eq("user_id", sub)
    .maybeSingle();
  if (!us || !us.activo || us.rol !== "asesor" || !us.asesor_id) return false;

  // Verificar que el lead está en call_queue asignado a este asesor
  const { data: cq } = await admin
    .from("call_queue")
    .select("id")
    .eq("lead_id", lead_id)
    .eq("asesor_id", us.asesor_id)
    .maybeSingle();
  return !!cq;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = adminClient();

  // ── Gate ─────────────────────────────────────────────────────────────────
  const secret = req.headers.get("x-internal-secret");
  const internalOk = !!secret && secret === Deno.env.get("INTERNAL_TASK_SECRET");

  // Parse body antes de los gates que necesitan lead_id
  let body: { lead_id?: string; monto?: number } = {};
  try { body = await req.json(); } catch { /* ignore */ }

  const lead_id = body.lead_id;
  if (!lead_id) {
    return json({ ok: false, error: "lead_id requerido" }, 200);
  }

  if (!internalOk) {
    const isAdmin = await callerIsAdmin(req, admin);
    if (!isAdmin) {
      const isOwner = await callerIsAsesorOwner(req, admin, lead_id);
      if (!isOwner) {
        return json({ ok: false, error: "No autorizado" }, 403);
      }
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
