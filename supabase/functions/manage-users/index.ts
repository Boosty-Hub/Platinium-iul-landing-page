import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, adminClient, callerIsAdmin } from "../_shared/integraciones.ts";

// Admin-gated CRUD for SYSTEM users (admins + asesores).
// GoTrue Admin API (SB_SECRET_KEY) for auth accounts + usuarios_sistema rows.
// verify_jwt=true; gate = callerIsAdmin().
//
// Business/validation errors return HTTP 200 with {ok:false,error} so the
// frontend surfaces a friendly Spanish message (matches kommo-metadata pattern).
// Only unexpected failures return 500.
//
// Actions: list | create | update | deactivate | reactivate

function res(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function callerSub(req: Request): string | null {
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (jwt.split(".").length !== 3) return null;
  try {
    return JSON.parse(atob(jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).sub ?? null;
  } catch { return null; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return res({ ok: false, error: "Method not allowed" }, 405);

  const admin = adminClient();
  if (!(await callerIsAdmin(req, admin))) return res({ ok: false, error: "No autorizado" }, 403);
  const callerId = callerSub(req);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return res({ ok: false, error: "JSON inválido" }, 400); }
  const action = body.action as string;

  try {
    // ── LIST: todos los usuarios del sistema (admin + asesor) ──
    if (action === "list") {
      const { data, error } = await admin
        .from("usuarios_sistema")
        .select(`user_id, email, rol, activo, creado_en, asesor_id, asesores ( id, nombre, rc_extension )`)
        .order("rol", { ascending: true })
        .order("creado_en", { ascending: true });
      if (error) throw new Error(error.message);
      return res({ ok: true, data });
    }

    // ── CREATE: admin o asesor ──
    if (action === "create") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");
      const rol = body.rol === "admin" ? "admin" : "asesor";
      const asesor_id = (body.asesor_id as string | null) ?? null;

      if (!email || !password) return res({ ok: false, error: "Correo y contraseña son requeridos." });
      if (password.length < 8) return res({ ok: false, error: "La contraseña debe tener al menos 8 caracteres." });
      if (rol === "asesor" && !asesor_id) return res({ ok: false, error: "Seleccioná el asesor a vincular." });

      // Un asesor solo puede tener un usuario vinculado.
      if (rol === "asesor") {
        const { data: linked } = await admin.from("usuarios_sistema").select("user_id").eq("asesor_id", asesor_id).maybeSingle();
        if (linked) return res({ ok: false, error: "Ese asesor ya tiene un usuario vinculado." });
      }

      const { data: authData, error: authError } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (authError || !authData?.user) {
        const m = authError?.message ?? "";
        if (/already.*regist|already been|duplicate/i.test(m)) return res({ ok: false, error: "Ya existe un usuario con ese correo." });
        if (/password/i.test(m)) return res({ ok: false, error: "Contraseña inválida (mínimo 8 caracteres)." });
        return res({ ok: false, error: m || "No se pudo crear el usuario." });
      }
      const user_id = authData.user.id;

      const { error: insErr } = await admin.from("usuarios_sistema").insert({
        user_id, email, rol, asesor_id: rol === "asesor" ? asesor_id : null, activo: true,
      });
      if (insErr) {
        await admin.auth.admin.deleteUser(user_id).catch(() => {});
        if (/uq_us_asesor_id|unique/i.test(insErr.message)) return res({ ok: false, error: "Ese asesor ya tiene un usuario vinculado." });
        return res({ ok: false, error: `No se pudo guardar el usuario: ${insErr.message}` });
      }
      return res({ ok: true, user_id });
    }

    // ── UPDATE: rol / asesor_id / activo ──
    if (action === "update") {
      const user_id = body.user_id as string;
      if (!user_id) return res({ ok: false, error: "user_id requerido" }, 400);
      const updates: Record<string, unknown> = {};
      if (body.rol === "admin" || body.rol === "asesor") {
        updates.rol = body.rol;
        if (body.rol === "admin") updates.asesor_id = null; // admin no se vincula a extensión
      }
      if (body.asesor_id !== undefined && updates.rol !== "admin") updates.asesor_id = body.asesor_id;
      if (body.activo !== undefined) updates.activo = body.activo;
      if (!Object.keys(updates).length) return res({ ok: false, error: "Nada para actualizar" }, 400);

      // No vincular un asesor ya tomado por otro usuario.
      if (typeof updates.asesor_id === "string") {
        const { data: linked } = await admin.from("usuarios_sistema").select("user_id").eq("asesor_id", updates.asesor_id).neq("user_id", user_id).maybeSingle();
        if (linked) return res({ ok: false, error: "Ese asesor ya tiene un usuario vinculado." });
      }
      const { error } = await admin.from("usuarios_sistema").update(updates).eq("user_id", user_id);
      if (error) {
        if (/uq_us_asesor_id|unique/i.test(error.message)) return res({ ok: false, error: "Ese asesor ya tiene un usuario vinculado." });
        throw new Error(error.message);
      }
      return res({ ok: true });
    }

    // ── DEACTIVATE: con guardas (no a sí mismo, no al último admin) ──
    if (action === "deactivate") {
      const user_id = body.user_id as string;
      if (!user_id) return res({ ok: false, error: "user_id requerido" }, 400);
      if (user_id === callerId) return res({ ok: false, error: "No podés desactivar tu propia cuenta." });

      const { data: target } = await admin.from("usuarios_sistema").select("rol").eq("user_id", user_id).maybeSingle();
      if (target?.rol === "admin") {
        const { count } = await admin.from("usuarios_sistema").select("user_id", { count: "exact", head: true }).eq("rol", "admin").eq("activo", true);
        if ((count ?? 0) <= 1) return res({ ok: false, error: "No podés desactivar al último administrador activo." });
      }

      const { error: dbErr } = await admin.from("usuarios_sistema").update({ activo: false }).eq("user_id", user_id);
      if (dbErr) throw new Error(dbErr.message);
      await admin.auth.admin.updateUserById(user_id, { ban_duration: "876000h" }).catch((e) => console.error("ban:", (e as Error).message));
      return res({ ok: true });
    }

    // ── REACTIVATE ──
    if (action === "reactivate") {
      const user_id = body.user_id as string;
      if (!user_id) return res({ ok: false, error: "user_id requerido" }, 400);
      const { error: dbErr } = await admin.from("usuarios_sistema").update({ activo: true }).eq("user_id", user_id);
      if (dbErr) throw new Error(dbErr.message);
      await admin.auth.admin.updateUserById(user_id, { ban_duration: "none" }).catch((e) => console.error("unban:", (e as Error).message));
      return res({ ok: true });
    }

    return res({ ok: false, error: `Acción desconocida: ${action}` }, 400);
  } catch (err) {
    console.error("manage-users error:", (err as Error).message);
    return res({ ok: false, error: (err as Error).message }, 500);
  }
});
