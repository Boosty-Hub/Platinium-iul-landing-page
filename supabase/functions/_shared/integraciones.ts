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
export interface KommoCfg {
  subdominio: string; access_token: string;
  pipeline_id?: string; status_id?: string; responsable_id?: string;
  status_no_contactado_id?: string;          // etapa a la que mover tras 3 intentos fallidos
  mapeo?: Record<string, string> | string;   // objeto o string JSON: '<campo>' → '<entity>:<fieldId>'
}

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

// Edad calculada a partir del año de nacimiento (el formulario solo pide el año).
// Aproximada (sin mes/día): edad ≈ año actual − año de nacimiento.
export function computeEdad(anio?: number | null): number | null {
  if (anio == null) return null;
  const y = Number(anio);
  if (!Number.isFinite(y) || y < 1900) return null;
  const edad = new Date().getFullYear() - y;
  return edad > 0 && edad < 130 ? edad : null;
}

// Nota formateada con TODA la data del lead (siempre funciona, no depende de custom fields).
export function kommoBuildNote(lead: LeadData): string {
  const L = (k: string, v: unknown) => (v != null && String(v).trim() !== "" ? `${k}: ${v}\n` : "");
  const edad = lead.edad ?? computeEdad(lead.anio_nacimiento);
  let t = "📋 LEAD WEB — Platinium IUL\n──────────────────────\n";
  t += L("👤 Nombre", lead.nombre);
  t += L("📞 Teléfono", lead.telefono);
  t += L("✉️ Email", lead.email);
  t += L("💬 Interés", lead.interes);
  t += L("🎂 Edad", edad != null ? `${edad} años${lead.anio_nacimiento ? ` (nac. ${lead.anio_nacimiento})` : ""}` : null);
  t += L("💵 Ahorro semanal", lead.ahorro_semanal);
  t += L("⚧ Género", lead.genero);
  t += L("📍 Ubicación", [lead.city, lead.region].filter(Boolean).join(", "));
  const utms = [
    L("Fuente", lead.fuente), L("UTM Source", lead.utm_source), L("UTM Medium", lead.utm_medium),
    L("UTM Campaign", lead.utm_campaign), L("UTM Content", lead.utm_content), L("UTM Term", lead.utm_term),
    L("gclid", lead.gclid), L("fbclid", lead.fbclid), L("Referrer", lead.referrer),
  ].join("");
  if (utms.trim()) t += "──── Atribución ────\n" + utms;
  return t.trim();
}

export async function kommoAddNote(cfg: KommoCfg, leadId: string, text: string) {
  const res = await fetch(`${kommoBase(cfg)}/leads/notes`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify([{ entity_id: Number(leadId), note_type: "common", params: { text } }]),
  });
  if (!res.ok) { const t = await res.text(); throw new Error(`Kommo note ${res.status}: ${t.slice(0, 200)}`); }
  return true;
}

// Crea el lead + contacto con TODA la data: campos estándar + custom fields mapeados + nota.
export async function kommoCreateLead(cfg: KommoCfg, lead: LeadData) {
  // El dashboard guarda `mapeo` como string JSON; aceptamos string u objeto.
  let mapeo: Record<string, string> = {};
  if (typeof cfg.mapeo === "string") {
    try { mapeo = JSON.parse(cfg.mapeo) || {}; } catch { mapeo = {}; }
  } else if (cfg.mapeo && typeof cfg.mapeo === "object") {
    mapeo = cfg.mapeo as Record<string, string>;
  }
  // Enriquecemos con la edad calculada para que sea mapeable y aparezca en la nota.
  const enriched: LeadData = { ...lead, edad: lead.edad ?? computeEdad(lead.anio_nacimiento) };
  const contactCF: Record<string, unknown>[] = [
    { field_code: "PHONE", values: [{ value: lead.telefono, enum_code: "WORK" }] },
    { field_code: "EMAIL", values: [{ value: lead.email, enum_code: "WORK" }] },
  ];
  const leadCF: Record<string, unknown>[] = [];
  // mapeo flexible: { "<nuestro_campo>": "<entity>:<field_id>" }  (entity = 'lead' | 'contact')
  // El dashboard arma estas claves desde los dropdowns de Kommo (por nombre, sin IDs visibles).
  for (const [ourField, target] of Object.entries(mapeo)) {
    const [entity, fid] = String(target).split(":");
    const val = (enriched as unknown as Record<string, unknown>)[ourField];
    if (!fid || val == null || String(val).trim() === "") continue;
    const cf = { field_id: Number(fid), values: [{ value: String(val) }] };
    if (entity === "contact") contactCF.push(cf); else leadCF.push(cf);
  }

  const leadObj: Record<string, unknown> = {
    name: `IUL Lead - ${lead.nombre}`,
    _embedded: { contacts: [{ name: lead.nombre, custom_fields_values: contactCF }] },
  };
  if (leadCF.length) leadObj.custom_fields_values = leadCF;
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

  // Nota con toda la data (best-effort, no rompe la creación si falla)
  if (kommoLeadId) {
    try { await kommoAddNote(cfg, String(kommoLeadId), kommoBuildNote(enriched)); }
    catch (e) { console.error("kommoCreateLead/note:", (e as Error).message); }
  }
  return { kommoLeadId: kommoLeadId ? String(kommoLeadId) : null };
}

// Metadata para configuración SIN IDs (dropdowns por nombre en el dashboard).
export async function kommoMetadata(cfg: KommoCfg) {
  const h = { Authorization: `Bearer ${cfg.access_token}` };
  const get = async (path: string) => {
    const r = await fetch(`${kommoBase(cfg)}${path}`, { headers: h });
    if (!r.ok) return null;
    return await r.json();
  };
  const [pipe, users, leadCF, contactCF] = await Promise.all([
    get("/leads/pipelines"), get("/users?limit=250"),
    get("/leads/custom_fields?limit=250"), get("/contacts/custom_fields?limit=250"),
  ]);
  return {
    pipelines: (pipe?._embedded?.pipelines ?? []).map((p: Record<string, any>) => ({
      id: p.id, name: p.name,
      statuses: (p._embedded?.statuses ?? []).map((s: Record<string, any>) => ({ id: s.id, name: s.name })),
    })),
    users: (users?._embedded?.users ?? []).map((u: Record<string, any>) => ({ id: u.id, name: u.name, email: u.email })),
    leadFields: (leadCF?._embedded?.custom_fields ?? []).map((f: Record<string, any>) => ({ id: f.id, name: f.name, type: f.type })),
    contactFields: (contactCF?._embedded?.custom_fields ?? []).map((f: Record<string, any>) => ({ id: f.id, name: f.name, type: f.type })),
  };
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
export interface LeadData {
  id: string; nombre: string; telefono: string; email: string;
  interes?: string | null; anio_nacimiento?: number | null; edad?: number | null; ahorro_semanal?: string | null;
  genero?: string | null; city?: string | null; region?: string | null;
  utm_source?: string | null; utm_medium?: string | null; utm_campaign?: string | null;
  utm_content?: string | null; utm_term?: string | null;
  gclid?: string | null; fbclid?: string | null; referrer?: string | null;
  fuente?: string | null; created_at?: string | null;
}

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
