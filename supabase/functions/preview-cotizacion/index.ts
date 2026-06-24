// preview-cotizacion — Resuelve la cotización y construye el email pero NO lo envía.
// Gate: verify_jwt=true + (admin OR asesor propietario del lead)
// Body: { lead_id, monto? }
// Response: { ok, html, monto, genero, edad }
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, adminClient, callerIsAdmin } from "../_shared/integraciones.ts";
import {
  pickMonto,
  edadCotiz,
  generoNorm,
  getCotizacionRow,
  buildCotizacionEmail,
  fmt,
} from "../_shared/cotizacion.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function getAsesorId(
  req: Request,
  admin: ReturnType<typeof adminClient>,
): Promise<string | null> {
  const auth = req.headers.get("Authorization") ?? "";
  const jwt = auth.replace(/^Bearer\s+/i, "");
  if (!jwt || jwt.split(".").length !== 3) return null;
  let sub: string | null = null;
  try {
    const payload = JSON.parse(
      atob(jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    sub = payload.sub ?? null;
  } catch {
    return null;
  }
  if (!sub) return null;
  const { data } = await admin
    .from("usuarios_sistema")
    .select("asesor_id, rol, activo")
    .eq("user_id", sub)
    .maybeSingle();
  if (!data || !data.activo || data.rol !== "asesor" || !data.asesor_id) return null;
  return data.asesor_id as string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = adminClient();

  // ── Gate ─────────────────────────────────────────────────────────────────
  const isAdmin = await callerIsAdmin(req, admin);
  const asesorId = isAdmin ? null : await getAsesorId(req, admin);
  if (!isAdmin && !asesorId) {
    return json({ ok: false, error: "No autorizado" }, 403);
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: { lead_id?: string; monto?: number } = {};
  try { body = await req.json(); } catch { /* ignore */ }
  const lead_id = body.lead_id;
  if (!lead_id) return json({ ok: false, error: "lead_id requerido" }, 200);

  // ── Asesor ownership check ────────────────────────────────────────────────
  if (!isAdmin && asesorId) {
    const { data: cq } = await admin
      .from("call_queue")
      .select("id")
      .eq("lead_id", lead_id)
      .eq("asesor_id", asesorId)
      .maybeSingle();
    if (!cq) return json({ ok: false, error: "No autorizado para este lead" }, 403);
  }

  // ── Cargar lead ───────────────────────────────────────────────────────────
  const { data: lead, error: leadErr } = await admin
    .from("leads")
    .select("id, nombre, email, telefono, genero, anio_nacimiento, ahorro_semanal")
    .eq("id", lead_id)
    .maybeSingle();
  if (leadErr) return json({ ok: false, error: leadErr.message }, 200);
  if (!lead) return json({ ok: false, error: "Lead no encontrado" }, 200);

  // ── Resolver perfil ───────────────────────────────────────────────────────
  const genero = generoNorm(lead.genero);
  const edad = edadCotiz(lead.anio_nacimiento);
  const monto = body.monto != null ? body.monto : pickMonto(lead.ahorro_semanal);

  if (!genero) return json({ ok: false, error: "Género del lead no válido" }, 200);
  if (edad == null) return json({ ok: false, error: "Año de nacimiento del lead no válido" }, 200);
  if (!lead.email) return json({ ok: false, error: "Lead sin email" }, 200);

  // ── Obtener fila cotización ───────────────────────────────────────────────
  const q = await getCotizacionRow(admin, genero, edad, monto).catch((e) => {
    throw new Error(`getCotizacionRow: ${(e as Error).message}`);
  });
  if (!q) return json({ ok: false, error: `Sin tabla para ese perfil (${genero}, edad ${edad}, $${monto})` }, 200);

  // ── Leer logos de Resend config (best-effort; si no hay config, usa vacío) ─
  let logoPlatinium = "";
  let logoNlg: string | null = null;
  try {
    const { data: resendRow } = await admin
      .from("app_integraciones")
      .select("config")
      .eq("clave", "resend")
      .maybeSingle();
    if (resendRow?.config) {
      logoPlatinium = resendRow.config.logo_platinium ?? "";
      logoNlg = resendRow.config.logo_nlg ?? null;
    }
  } catch { /* best-effort */ }

  // ── Construir email ───────────────────────────────────────────────────────
  const hoy = new Date().toLocaleDateString("es-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  try {
    const html = buildCotizacionEmail(
      { nombre: lead.nombre, email: lead.email, telefono: lead.telefono ?? "", edad },
      q,
      { logoPlatinium, logoNlg, hoy },
    );
    return json({ ok: true, html, monto, genero, edad });
  } catch (e) {
    console.error("preview-cotizacion build error:", e);
    return json({ ok: false, error: (e as Error).message }, 200);
  }
});
