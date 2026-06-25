// asesor-accept-lead — el asesor ACEPTA un lead entrante (tocó "Contestar").
//
// En el modelo click-to-call, al aceptar, el softphone del asesor marca al cliente.
// Este endpoint solo deja la SEÑAL de aceptación en call_attempts.accepted_at; el
// motor (process-call-queue) la está esperando para dejar de ofrecer el lead a otros.
//
// verify_jwt=false: autenticación manual (x-internal-secret | JWT admin | JWT asesor-owner).
// Body: { attempt_id }.  Respuesta 200 siempre (errores de negocio = {ok:false,error}).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, adminClient } from "../_shared/integraciones.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = adminClient();
  const INTERNAL_SECRET = Deno.env.get("INTERNAL_SECRET") ?? "";
  const xSecret = req.headers.get("x-internal-secret") ?? "";
  const isInternal = INTERNAL_SECRET && xSecret === INTERNAL_SECRET;

  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  let callerAsesorId: string | null = null;
  let isAdmin = false;

  if (!isInternal) {
    const auth = req.headers.get("Authorization") ?? "";
    const jwt = auth.replace(/^Bearer\s+/i, "");
    if (!jwt || jwt.split(".").length !== 3) return json({ ok: false, error: "No autorizado" }, 401);
    let sub: string | null = null;
    try {
      const payload = JSON.parse(atob(jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      sub = payload.sub ?? null;
    } catch {
      return json({ ok: false, error: "JWT inválido" }, 401);
    }
    const { data: caller } = await admin
      .from("usuarios_sistema")
      .select("rol, activo, asesor_id")
      .eq("user_id", sub!)
      .maybeSingle();
    if (!caller || !caller.activo) return json({ ok: false, error: "No autorizado" }, 403);
    if (caller.rol === "admin") isAdmin = true;
    else if (caller.rol === "asesor" && caller.asesor_id) callerAsesorId = caller.asesor_id as string;
    else return json({ ok: false, error: "No autorizado" }, 403);
  }

  let body: { attempt_id?: string };
  try { body = await req.json(); } catch { return json({ ok: false, error: "Body JSON inválido" }); }
  const { attempt_id } = body;
  if (!attempt_id) return json({ ok: false, error: "Falta attempt_id" });

  // Cargar el intento.
  const { data: attempt } = await admin
    .from("call_attempts")
    .select("id, asesor_id, accepted_at")
    .eq("id", attempt_id)
    .maybeSingle();
  if (!attempt) return json({ ok: false, error: "Intento no encontrado" });

  // Ownership: el asesor solo puede aceptar SU propio intento.
  if (!isInternal && !isAdmin && attempt.asesor_id !== callerAsesorId) {
    return json({ ok: false, error: "Este lead no se te está ofreciendo a vos." });
  }

  // Idempotente: si ya estaba aceptado, ok.
  if (attempt.accepted_at) return json({ ok: true, already: true });

  await admin.from("call_attempts").update({ accepted_at: new Date().toISOString() }).eq("id", attempt_id);
  return json({ ok: true });
});
