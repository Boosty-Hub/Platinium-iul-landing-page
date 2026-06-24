// get-recording — return a time-limited signed URL for a call recording.
// verify_jwt=true (Supabase validates JWT before this handler runs).
//
// Gate:
//   - Admin (callerIsAdmin) → any attempt_id.
//   - Asesor (rol='asesor') → only their own attempts (asesor_id matches).
//   - No JWT → 401.
//   - Wrong owner → 403.
//
// RC token NEVER appears in any response.
// Signed URL TTL: 300 seconds.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, adminClient } from "../_shared/integraciones.ts";

const SIGNED_URL_TTL_SEC = 300;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = adminClient();

    // ── 1. Extract and decode JWT ─────────────────────────────────────────────
    const auth = req.headers.get("Authorization") ?? "";
    const jwt  = auth.replace(/^Bearer\s+/i, "");
    if (!jwt || jwt.split(".").length !== 3) {
      return json({ ok: false, error: "No autorizado" }, 401);
    }

    let sub: string | null = null;
    try {
      const payload = JSON.parse(
        atob(jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      sub = payload.sub ?? null;
    } catch {
      return json({ ok: false, error: "JWT inválido" }, 401);
    }

    if (!sub) return json({ ok: false, error: "JWT sin sub" }, 401);

    // ── 2. Resolve caller from usuarios_sistema ───────────────────────────────
    const { data: caller, error: callerErr } = await admin
      .from("usuarios_sistema")
      .select("rol, asesor_id, activo")
      .eq("user_id", sub)
      .maybeSingle();

    if (callerErr || !caller || !caller.activo) {
      return json({ ok: false, error: "No autorizado" }, 401);
    }

    const isAdmin  = caller.rol === "admin";
    const isAsesor = caller.rol === "asesor" && !!caller.asesor_id;

    if (!isAdmin && !isAsesor) {
      return json({ ok: false, error: "Rol no autorizado" }, 403);
    }

    // ── 3. Parse request body ─────────────────────────────────────────────────
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const attemptId = (body as { attempt_id?: string }).attempt_id;

    if (!attemptId) {
      return json({ ok: false, error: "attempt_id es requerido" }, 400);
    }

    // ── 4. Fetch the call_attempt ─────────────────────────────────────────────
    const { data: attempt, error: attemptErr } = await admin
      .from("call_attempts")
      .select("id, asesor_id, recording_storage_path")
      .eq("id", attemptId)
      .maybeSingle();

    if (attemptErr || !attempt) {
      return json({ ok: false, error: "Intento no encontrado" }, 404);
    }

    // ── 5. Authorization: admin bypasses; asesor must own the attempt ──────────
    if (!isAdmin) {
      if (attempt.asesor_id !== caller.asesor_id) {
        return json({ ok: false, error: "No autorizado" }, 403);
      }
    }

    // ── 6. Check recording exists ─────────────────────────────────────────────
    if (!attempt.recording_storage_path) {
      return json({ ok: false, error: "Grabación no disponible aún" }, 404);
    }

    // ── 7. Generate signed URL (service client bypasses Storage RLS) ──────────
    const { data: signedData, error: signedErr } = await admin.storage
      .from("call-recordings")
      .createSignedUrl(attempt.recording_storage_path as string, SIGNED_URL_TTL_SEC);

    if (signedErr || !signedData?.signedUrl) {
      console.error("get-recording: createSignedUrl error:", signedErr?.message);
      return json({ ok: false, error: "Error generando URL de grabación" }, 500);
    }

    // RC token is NEVER in this response — only the Supabase signed URL
    return json({ ok: true, url: signedData.signedUrl, ttl: SIGNED_URL_TTL_SEC });
  } catch (e) {
    console.error("get-recording: unexpected error:", (e as Error).message);
    return json({ ok: false, error: (e as Error).message }, 500);
  }
});
