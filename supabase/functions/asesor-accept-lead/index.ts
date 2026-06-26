// asesor-accept-lead — el asesor ACEPTA un lead entrante (tocó "Contestar").
//
// En el modelo click-to-call, al aceptar, el softphone del asesor marca al cliente.
// Este endpoint solo deja la SEÑAL de aceptación en call_attempts.accepted_at; el
// motor (process-call-queue) la está esperando para dejar de ofrecer el lead a otros.
//
// verify_jwt=false: autenticación manual (x-internal-secret | JWT admin | JWT asesor-owner).
// Body: { attempt_id }.  Respuesta 200 siempre (errores de negocio = {ok:false,error}).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, adminClient, getIntegracion } from "../_shared/integraciones.ts";
import type { KommoCfg } from "../_shared/integraciones.ts";
import { claimLeadOnAccept } from "../_shared/call_engine.ts";

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
    // Verifica la FIRMA del JWT contra Supabase Auth (no confiar en el payload sin verificar).
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    const sub = userData?.user?.id ?? null;
    if (userErr || !sub) return json({ ok: false, error: "No autorizado" }, 401);
    const { data: caller } = await admin
      .from("usuarios_sistema")
      .select("rol, activo, asesor_id")
      .eq("user_id", sub)
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
    .select("id, asesor_id, lead_id, inicio_at, accepted_at")
    .eq("id", attempt_id)
    .maybeSingle();
  if (!attempt) return json({ ok: false, error: "Intento no encontrado" });

  // Ownership: el asesor solo puede aceptar SU propio intento.
  if (!isInternal && !isAdmin && attempt.asesor_id !== callerAsesorId) {
    return json({ ok: false, error: "Este lead no se te está ofreciendo a vos." });
  }

  // Claim AUTORITATIVO: este endpoint (no el motor) es la fuente de verdad de la
  // aceptación. Transiciona el intento a advisor_answered, reclama la cola para el
  // asesor (in_progress) y sincroniza Kommo. Idempotente y a prueba de que el motor
  // esté vivo o no. claimLeadOnAccept hace el guard anti-doble-asignación.
  const kommoI = await getIntegracion(admin, "kommo");
  const kommo = kommoI?.activo ? (kommoI.config as unknown as KommoCfg) : null;
  const r = await claimLeadOnAccept(admin, {
    id: attempt.id as string,
    asesor_id: attempt.asesor_id as string,
    lead_id: attempt.lead_id as string,
    inicio_at: attempt.inicio_at as string | null,
    accepted_at: attempt.accepted_at as string | null,
  }, kommo);

  if (!r.claimed) return json({ ok: false, error: "Otro asesor ya tomó este lead." });
  return json({ ok: true });
});
