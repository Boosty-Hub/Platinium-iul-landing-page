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
  let isAdmin = isInternal;                 // el secreto interno actúa como admin
  let callerAsesorId: string | null = null;

  if (!isInternal) {
    const auth = req.headers.get("Authorization") ?? "";
    const jwt = auth.replace(/^Bearer\s+/i, "");
    if (!jwt || jwt.split(".").length !== 3) return json({ ok: false, error: "No autorizado" }, 401);
    // Verifica la FIRMA del JWT contra Supabase Auth — NO confiar en el payload sin
    // verificar (si no, se podría forjar un sub arbitrario).
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    const sub = userData?.user?.id ?? null;
    if (userErr || !sub) return json({ ok: false, error: "No autorizado" }, 401);
    const { data: caller } = await admin
      .from("usuarios_sistema").select("rol, activo, asesor_id").eq("user_id", sub).maybeSingle();
    if (!caller || !caller.activo) return json({ ok: false, error: "No autorizado" }, 403);
    if (caller.rol === "admin") isAdmin = true;
    else if (caller.rol === "asesor" && caller.asesor_id) callerAsesorId = caller.asesor_id as string;
    else return json({ ok: false, error: "No autorizado" }, 403);
  }

  // ── Body ───────────────────────────────────────────────────────────────────
  let body: { lead_id?: string; edad?: number; genero?: string; ahorro_semanal?: number; email?: string };
  try { body = await req.json(); } catch { return json({ ok: false, error: "Body JSON inválido" }); }
  const { lead_id } = body;
  if (!lead_id) return json({ ok: false, error: "Falta lead_id" });

  // ── Pertenencia: el asesor SOLO edita leads que tiene asignados ──────────────
  // (es suyo si la cola lo tiene como asesor_id —atendiéndolo— o solo_asesor_id
  // —recontacto fijado a él—). El admin/interno puede editar cualquiera.
  if (!isAdmin) {
    const { data: q } = await admin
      .from("call_queue").select("asesor_id, solo_asesor_id").eq("lead_id", lead_id).maybeSingle();
    const owns = !!q && (q.asesor_id === callerAsesorId || q.solo_asesor_id === callerAsesorId);
    if (!owns) return json({ ok: false, error: "Este lead no está asignado a vos." }, 403);
  }

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
