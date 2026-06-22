// Helpers compartidos para integraciones (Kommo, RingCentral) y gate de admin.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SB_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

// ── Gate de admin ────────────────────────────────────────────────────────────
// verify_jwt=true (default) ya validó la firma del JWT, así que confiamos en el
// claim `sub` y verificamos el rol contra usuarios_sistema con service_role.
export async function callerIsAdmin(req: Request, admin: ReturnType<typeof adminClient>): Promise<boolean> {
  const auth = req.headers.get("Authorization") ?? "";
  const jwt = auth.replace(/^Bearer\s+/i, "");
  if (!jwt || jwt.split(".").length !== 3) return false;
  let sub: string | null = null;
  try {
    const payload = JSON.parse(atob(jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    sub = payload.sub ?? null;
  } catch { return false; }
  if (!sub) return false;
  const { data, error } = await admin
    .from("usuarios_sistema")
    .select("rol, activo")
    .eq("user_id", sub)
    .maybeSingle();
  return !error && !!data && data.activo === true && data.rol === "admin";
}

export async function getIntegracion(admin: ReturnType<typeof adminClient>, clave: string) {
  const { data, error } = await admin
    .from("app_integraciones")
    .select("activo, config")
    .eq("clave", clave)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer la config de ${clave}: ${error.message}`);
  return data as { activo: boolean; config: Record<string, string> } | null;
}

// ── Kommo (API v4) ───────────────────────────────────────────────────────────
export interface KommoCfg { subdominio: string; access_token: string; pipeline_id?: string; status_id?: string; responsable_id?: string; }

function kommoBase(cfg: KommoCfg) { return `https://${cfg.subdominio}.kommo.com/api/v4`; }

export async function kommoTest(cfg: KommoCfg) {
  if (!cfg.subdominio || !cfg.access_token) throw new Error("Falta subdominio o access_token de Kommo.");
  const res = await fetch(`${kommoBase(cfg)}/account`, {
    headers: { Authorization: `Bearer ${cfg.access_token}` },
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(`Kommo respondió ${res.status}: ${txt.slice(0, 200)}`);
  const acc = JSON.parse(txt);
  return { id: acc.id, name: acc.name, subdomain: acc.subdomain };
}

export async function kommoCreateLead(cfg: KommoCfg, lead: { nombre: string; telefono: string; email: string; interes?: string }) {
  const leadObj: Record<string, unknown> = {
    name: `IUL Lead - ${lead.nombre}`,
    _embedded: {
      contacts: [{
        name: lead.nombre,
        custom_fields_values: [
          { field_code: "PHONE", values: [{ value: lead.telefono, enum_code: "WORK" }] },
          { field_code: "EMAIL", values: [{ value: lead.email, enum_code: "WORK" }] },
        ],
      }],
    },
  };
  if (cfg.pipeline_id) leadObj.pipeline_id = Number(cfg.pipeline_id);
  if (cfg.status_id) leadObj.status_id = Number(cfg.status_id);
  if (cfg.responsable_id) leadObj.responsible_user_id = Number(cfg.responsable_id);

  const res = await fetch(`${kommoBase(cfg)}/leads/complex`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify([leadObj]),
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(`Kommo create ${res.status}: ${txt.slice(0, 300)}`);
  const data = JSON.parse(txt);
  const kommoLeadId = data?.[0]?.id ?? data?._embedded?.leads?.[0]?.id ?? null;
  return { kommoLeadId: kommoLeadId ? String(kommoLeadId) : null };
}

// ── RingCentral ──────────────────────────────────────────────────────────────
export interface RCCfg { server_url: string; client_id: string; client_secret: string; jwt_token: string; from_number: string; }

export async function rcAuth(cfg: RCCfg): Promise<string> {
  if (!cfg.client_id || !cfg.client_secret || !cfg.jwt_token) throw new Error("Faltan credenciales de RingCentral.");
  const basic = btoa(`${cfg.client_id}:${cfg.client_secret}`);
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: cfg.jwt_token,
  });
  const res = await fetch(`${cfg.server_url}/restapi/oauth/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(`RingCentral auth ${res.status}: ${txt.slice(0, 200)}`);
  return JSON.parse(txt).access_token as string;
}

export async function rcRingOut(cfg: RCCfg, toNumber: string) {
  const token = await rcAuth(cfg);
  const res = await fetch(`${cfg.server_url}/restapi/v1.0/account/~/extension/~/ring-out`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: { phoneNumber: cfg.from_number }, to: { phoneNumber: toNumber }, playPrompt: false }),
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(`RingOut ${res.status}: ${txt.slice(0, 300)}`);
  const data = JSON.parse(txt);
  return { id: data?.id ?? null, status: data?.status?.callStatus ?? "Unknown" };
}

// ── Orquestador: lead → Kommo → RingCentral ──────────────────────────────────
export interface LeadData { id: string; nombre: string; telefono: string; email: string; interes?: string }

export async function procesarLead(
  admin: ReturnType<typeof adminClient>,
  lead: LeadData,
  opts: { llamar?: boolean } = {},
) {
  const llamar = opts.llamar ?? true;
  const result: { kommo: unknown; ringcentral: unknown } = { kommo: null, ringcentral: null };

  // 1) Crear en Kommo
  const kommo = await getIntegracion(admin, "kommo");
  if (kommo?.activo) {
    try {
      const { kommoLeadId } = await kommoCreateLead(kommo.config as unknown as KommoCfg, lead);
      if (kommoLeadId) {
        await admin.from("leads").update({ kommo_synced: true, kommo_lead_id: kommoLeadId }).eq("id", lead.id);
      }
      result.kommo = { ok: true, kommoLeadId };
    } catch (e) {
      console.error("procesarLead/kommo:", (e as Error).message);
      result.kommo = { ok: false, error: (e as Error).message };
    }
  } else {
    result.kommo = { ok: false, skipped: "inactivo" };
  }

  // 2) Llamar por RingCentral (RingOut automático)
  const rc = await getIntegracion(admin, "ringcentral");
  if (rc?.activo && llamar) {
    try {
      const out = await rcRingOut(rc.config as unknown as RCCfg, lead.telefono);
      result.ringcentral = { ok: true, ...out };
    } catch (e) {
      console.error("procesarLead/ringcentral:", (e as Error).message);
      result.ringcentral = { ok: false, error: (e as Error).message };
    }
  } else {
    result.ringcentral = { ok: false, skipped: rc?.activo ? "sin_llamada" : "inactivo" };
  }

  return result;
}
