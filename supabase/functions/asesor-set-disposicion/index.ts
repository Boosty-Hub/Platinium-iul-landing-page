// asesor-set-disposicion — registra la disposición de un lead tras una llamada.
//
// verify_jwt=false: autenticación manual (x-internal-secret | JWT admin | JWT asesor-owner).
// El asesor solo puede poner disposición en leads que le pertenecen (call_queue.asesor_id
// o call_queue.solo_asesor_id). El admin puede hacerlo en cualquier lead.
//
// Body: { lead_id, disposicion, nota?, programar_para? }
// Respuesta 200 siempre (errores de negocio = {ok:false, error:string}).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, adminClient, callerIsAdmin } from "../_shared/integraciones.ts";
import { setDisposicion, DISPOSICIONES } from "../_shared/seguimiento.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const admin = adminClient();
  const INTERNAL_SECRET = Deno.env.get("INTERNAL_SECRET") ?? "";

  // ── Gate de autorización ───────────────────────────────────────────────────
  const xSecret = req.headers.get("x-internal-secret") ?? "";
  const isInternal = INTERNAL_SECRET && xSecret === INTERNAL_SECRET;

  let callerAsesorId: string | null = null;
  let isAdmin = false;

  if (!isInternal) {
    // Validar JWT manualmente
    const auth = req.headers.get("Authorization") ?? "";
    const jwt = auth.replace(/^Bearer\s+/i, "");
    if (!jwt || jwt.split(".").length !== 3) {
      return new Response(JSON.stringify({ ok: false, error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verifica la FIRMA del JWT contra Supabase Auth — no confiar en el payload sin verificar.
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    const sub: string | null = userData?.user?.id ?? null;
    if (userErr || !sub) {
      return new Response(JSON.stringify({ ok: false, error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: caller } = await admin
      .from("usuarios_sistema")
      .select("rol, activo, asesor_id")
      .eq("user_id", sub)
      .maybeSingle();

    if (!caller || !caller.activo) {
      return new Response(JSON.stringify({ ok: false, error: "No autorizado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (caller.rol === "admin") {
      isAdmin = true;
    } else if (caller.rol === "asesor" && caller.asesor_id) {
      callerAsesorId = caller.asesor_id as string;
    } else {
      return new Response(JSON.stringify({ ok: false, error: "No autorizado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: {
    lead_id?: string;
    disposicion?: string;
    nota?: string | null;
    programar_para?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Body JSON inválido" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { lead_id, disposicion, nota, programar_para } = body;

  if (!lead_id) {
    return new Response(JSON.stringify({ ok: false, error: "Falta lead_id" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!disposicion) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Falta disposicion",
        opciones: DISPOSICIONES,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // ── Resolver asesor_id efectivo + ownership ────────────────────────────────
  let effectiveAsesorId: string;

  if (isInternal || isAdmin) {
    // Admin/internal: resolver el asesor_id desde call_queue del lead
    const { data: qRow } = await admin
      .from("call_queue")
      .select("asesor_id, solo_asesor_id")
      .eq("lead_id", lead_id)
      .maybeSingle();
    effectiveAsesorId = (qRow?.asesor_id ?? qRow?.solo_asesor_id) as string;
    // Si no hay asesor asignado todavía (lead nuevo), dejamos el id vacío;
    // seguimiento.ts admite asesor_id null.
    effectiveAsesorId = effectiveAsesorId ?? "";
  } else {
    // Asesor: verificar ownership
    const { data: qRow } = await admin
      .from("call_queue")
      .select("asesor_id, solo_asesor_id")
      .eq("lead_id", lead_id)
      .maybeSingle();

    const ownsLead =
      qRow?.asesor_id === callerAsesorId ||
      qRow?.solo_asesor_id === callerAsesorId;

    if (!ownsLead) {
      return new Response(
        JSON.stringify({ ok: false, error: "Este lead no está asignado a tu cuenta." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    effectiveAsesorId = callerAsesorId!;
  }

  // ── setDisposicion ─────────────────────────────────────────────────────────
  const result = await setDisposicion(admin, {
    lead_id,
    asesor_id: effectiveAsesorId,
    disposicion,
    nota: nota ?? null,
    programar_para: programar_para ?? null,
  });

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
