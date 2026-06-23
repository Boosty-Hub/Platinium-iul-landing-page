// Motor de la cola de llamadas. Lo dispara pg_cron (cada minuto, vía pg_net con
// x-internal-secret) y también submit-lead al llegar un lead. Gate: secreto
// interno HMAC-like O admin (JWT sub → usuarios_sistema rol=admin).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, adminClient, callerIsAdmin } from "../_shared/integraciones.ts";
import { processCallQueueTick } from "../_shared/call_engine.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = adminClient();
  const secret = req.headers.get("x-internal-secret");
  const internalOk = !!secret && secret === Deno.env.get("INTERNAL_TASK_SECRET");
  if (!internalOk && !(await callerIsAdmin(req, admin))) {
    return json({ error: "No autorizado" }, 403);
  }

  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const maxItems = Math.min(Number((body as { maxItems?: number }).maxItems ?? 1) || 1, 5);
    const result = await processCallQueueTick(admin, { maxItems });
    return json({ ok: true, ...result });
  } catch (e) {
    console.error("process-call-queue error:", e);
    return json({ ok: false, error: (e as Error).message }, 500);
  }
});
