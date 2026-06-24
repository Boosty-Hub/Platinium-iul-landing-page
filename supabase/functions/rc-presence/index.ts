import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, adminClient, callerIsAdmin, getIntegracion, rcAuth, type RCCfg } from "../_shared/integraciones.ts";

// Estado telefónico en vivo de las extensiones (para el panel de Asesores).
// Admin-gated. Devuelve { ok, presence: { "102": {tel, presence, user}, ... } }.
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = adminClient();
  if (!(await callerIsAdmin(req, admin))) return json({ ok: false, error: "No autorizado" }, 403);

  try {
    const rc = await getIntegracion(admin, "ringcentral");
    if (!rc?.activo) return json({ ok: true, presence: {} });
    const cfg = rc.config as unknown as RCCfg;
    const token = await rcAuth(cfg);
    const res = await fetch(
      `${cfg.server_url}/restapi/v1.0/account/~/presence?detailedTelephonyState=true&perPage=250`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) { const t = await res.text(); return json({ ok: false, error: `RingCentral ${res.status}: ${t.slice(0, 150)}` }); }
    const data = await res.json();
    const presence: Record<string, { tel: string; presence: string; user: string }> = {};
    for (const r of (data?.records ?? [])) {
      const ext = r?.extension?.extensionNumber;
      if (ext) presence[String(ext)] = {
        tel: r?.telephonyStatus ?? "Unknown",
        presence: r?.presenceStatus ?? "Unknown",
        user: r?.userStatus ?? "",
      };
    }
    return json({ ok: true, presence });
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, 200);
  }
});
