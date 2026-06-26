// asesor-update-lead — el asesor corrige datos del lead durante/tras la llamada
// (edad, género, ahorro semanal, email) para cotizar con la data real.
//
// verify_jwt=false: autenticación manual (x-internal-secret | JWT admin | JWT asesor).
// Body: { lead_id, edad?, genero?, ahorro_semanal?, email? }
// Respuesta 200 siempre (errores de negocio = {ok:false, error}).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, adminClient } from "../_shared/integraciones.ts";

const GENEROS = new Set(["Masculino", "Femenino"]);

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = adminClient();
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  // ── Gate ───────────────────────────────────────────────────────────────────
  const INTERNAL_SECRET = Deno.env.get("INTERNAL_SECRET") ?? "";
  const xSecret = req.headers.get("x-internal-secret") ?? "";
  const isInternal = INTERNAL_SECRET && xSecret === INTERNAL_SECRET;
  let isAuthorized = isInternal;

  if (!isInternal) {
    const auth = req.headers.get("Authorization") ?? "";
    const jwt = auth.replace(/^Bearer\s+/i, "");
    if (!jwt || jwt.split(".").length !== 3) return json({ ok: false, error: "No autorizado" }, 401);
    let sub: string | null = null;
    try {
      const payload = JSON.parse(atob(jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      sub = payload.sub ?? null;
    } catch { return json({ ok: false, error: "JWT inválido" }, 401); }
    const { data: caller } = await admin
      .from("usuarios_sistema").select("rol, activo").eq("user_id", sub!).maybeSingle();
    if (!caller || !caller.activo) return json({ ok: false, error: "No autorizado" }, 403);
    if (caller.rol === "admin" || caller.rol === "asesor") isAuthorized = true;
    else return json({ ok: false, error: "No autorizado" }, 403);
  }
  if (!isAuthorized) return json({ ok: false, error: "No autorizado" }, 403);

  // ── Body ───────────────────────────────────────────────────────────────────
  let body: { lead_id?: string; edad?: number; genero?: string; ahorro_semanal?: number; email?: string };
  try { body = await req.json(); } catch { return json({ ok: false, error: "Body JSON inválido" }); }
  const { lead_id } = body;
  if (!lead_id) return json({ ok: false, error: "Falta lead_id" });

  // ── Construir patch solo con campos válidos ──────────────────────────────────
  const patch: Record<string, unknown> = {};
  if (body.edad != null) {
    const edad = Number(body.edad);
    if (!Number.isFinite(edad) || edad < 18 || edad > 100) return json({ ok: false, error: "Edad fuera de rango (18–100)" });
    patch.anio_nacimiento = new Date().getFullYear() - Math.round(edad);
  }
  if (body.genero != null) {
    if (!GENEROS.has(body.genero)) return json({ ok: false, error: "Género inválido" });
    patch.genero = body.genero;
  }
  if (body.ahorro_semanal != null) {
    const a = Number(body.ahorro_semanal);
    if (!Number.isFinite(a) || a < 0) return json({ ok: false, error: "Ahorro inválido" });
    patch.ahorro_semanal = Math.round(a);
  }
  if (body.email != null && body.email.trim()) patch.email = body.email.trim();

  if (!Object.keys(patch).length) return json({ ok: false, error: "Nada que actualizar" });

  const { error } = await admin.from("leads").update(patch).eq("id", lead_id);
  if (error) return json({ ok: false, error: error.message });

  const edad = patch.anio_nacimiento ? new Date().getFullYear() - Number(patch.anio_nacimiento) : undefined;
  return json({ ok: true, lead_id, edad, genero: patch.genero, ahorro_semanal: patch.ahorro_semanal });
});
