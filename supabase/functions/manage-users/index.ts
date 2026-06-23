import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  adminClient,
  callerIsAdmin,
} from "../_shared/integraciones.ts";

// Admin-gated CRUD for asesor user accounts.
// Uses GoTrue Admin API (SB_SECRET_KEY) to create/disable auth users.
// verify_jwt=true (default) — Supabase validates JWT before we see the request.
// Gate: callerIsAdmin() — admin role in usuarios_sistema required.
//
// Actions in body.action:
//   list     → returns asesor users joined with asesores table
//   create   → creates GoTrue user + inserts usuarios_sistema row
//   update   → update asesor_id and/or activo on an existing row
//   deactivate → set activo=false + ban the GoTrue user
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = adminClient();

  // Admin gate — callerIsAdmin uses service_role client to verify rol='admin'
  if (!(await callerIsAdmin(req, admin))) {
    return new Response(JSON.stringify({ ok: false, error: "No autorizado" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const action = body.action as string;

  try {
    if (action === "list") {
      // Return asesor users joined with asesores for name/extension display
      const { data, error } = await admin
        .from("usuarios_sistema")
        .select(`
          user_id,
          email,
          rol,
          activo,
          creado_en,
          asesor_id,
          asesores (
            id,
            nombre,
            rc_extension
          )
        `)
        .eq("rol", "asesor")
        .order("creado_en");

      if (error) throw new Error(error.message);

      return new Response(JSON.stringify({ ok: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create") {
      const email = body.email as string;
      const password = body.password as string;
      const asesor_id = body.asesor_id as string;

      if (!email || !password || !asesor_id) {
        return new Response(
          JSON.stringify({ ok: false, error: "email, password y asesor_id son requeridos" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create GoTrue user with confirmed email so they can log in immediately
      const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (authError || !authData.user) {
        throw new Error(authError?.message ?? "Error creando el usuario en GoTrue");
      }

      const user_id = authData.user.id;

      // Insert into usuarios_sistema linking to the asesor
      const { error: insertError } = await admin.from("usuarios_sistema").insert({
        user_id,
        email,
        rol: "asesor",
        asesor_id,
        activo: true,
      });

      if (insertError) {
        // Rollback: delete the GoTrue user to avoid orphan accounts
        await admin.auth.admin.deleteUser(user_id).catch(() => {});
        throw new Error(`Error insertando en usuarios_sistema: ${insertError.message}`);
      }

      return new Response(JSON.stringify({ ok: true, user_id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update") {
      const user_id = body.user_id as string;
      if (!user_id) {
        return new Response(
          JSON.stringify({ ok: false, error: "user_id es requerido" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const updates: Record<string, unknown> = {};
      if (body.asesor_id !== undefined) updates.asesor_id = body.asesor_id;
      if (body.activo !== undefined) updates.activo = body.activo;

      if (Object.keys(updates).length === 0) {
        return new Response(
          JSON.stringify({ ok: false, error: "No hay campos para actualizar" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await admin
        .from("usuarios_sistema")
        .update(updates)
        .eq("user_id", user_id)
        .eq("rol", "asesor");

      if (error) throw new Error(error.message);

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "deactivate") {
      const user_id = body.user_id as string;
      if (!user_id) {
        return new Response(
          JSON.stringify({ ok: false, error: "user_id es requerido" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Set activo=false in usuarios_sistema (is_asesor() will return false from now on)
      const { error: dbError } = await admin
        .from("usuarios_sistema")
        .update({ activo: false })
        .eq("user_id", user_id)
        .eq("rol", "asesor");

      if (dbError) throw new Error(dbError.message);

      // Also ban the GoTrue user so they cannot get new sessions
      // (ban_duration: "876000h" = 100 years — effectively permanent until re-enabled)
      const { error: authError } = await admin.auth.admin.updateUserById(user_id, {
        ban_duration: "876000h",
      });

      if (authError) {
        console.error("manage-users/deactivate: GoTrue ban failed:", authError.message);
        // Still return ok — DB activo=false is the authoritative gate via is_asesor()
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ ok: false, error: `Acción desconocida: ${action}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("manage-users error:", (err as Error).message);
    return new Response(
      JSON.stringify({ ok: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
