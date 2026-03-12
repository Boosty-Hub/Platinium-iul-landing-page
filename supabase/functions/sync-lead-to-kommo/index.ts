import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { lead_id } = await req.json();
    if (!lead_id) throw new Error("lead_id requerido");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Leer lead
    const { data: lead, error } = await supabase
      .from("leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (error || !lead) throw new Error("Lead no encontrado");

    // Enviar a Kommo
    const KOMMO_WEBHOOK = Deno.env.get("KOMMO_WEBHOOK_URL");
    if (!KOMMO_WEBHOOK) {
      console.log("KOMMO_WEBHOOK_URL no configurado, skip sync");
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const kommoPayload = {
      source_name: "Landing IUL - platiniuminsuranceusa.com",
      source_uid: "platinium-iul-landing",
      created_at: Math.floor(new Date(lead.created_at).getTime() / 1000),
      metadata: {
        form_id: "iul-consulta",
        form_name: "Consulta Gratuita IUL",
        form_page: "https://platiniuminsuranceusa.com",
        form_sent_at: lead.created_at,
        referer: lead.referrer || "direct",
        ip: lead.ip_address || "",
      },
      contact: {
        name: lead.nombre,
        first_name: lead.nombre.split(" ")[0],
        last_name: lead.nombre.split(" ").slice(1).join(" ") || "",
        custom_fields_values: [
          { field_code: "PHONE", values: [{ value: lead.telefono, enum_code: "WORK" }] },
          { field_code: "EMAIL", values: [{ value: lead.email, enum_code: "WORK" }] },
        ],
      },
      leads: [{
        name: `IUL Lead - ${lead.nombre}`,
        custom_fields_values: [
          { field_name: "Interés", values: [{ value: lead.interes || "No especificado" }] },
          { field_name: "Año Nacimiento", values: [{ value: lead.anio_nacimiento?.toString() || "" }] },
          { field_name: "Ahorro Semanal", values: [{ value: lead.ahorro_semanal ? `$${lead.ahorro_semanal}/semana` : "" }] },
          { field_name: "UTM Source", values: [{ value: lead.utm_source || "" }] },
          { field_name: "UTM Campaign", values: [{ value: lead.utm_campaign || "" }] },
        ],
        tags: [
          { name: "IUL" },
          { name: "Landing Web" },
          { name: lead.interes || "General" },
        ],
      }],
    };

    const kommoRes = await fetch(KOMMO_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(kommoPayload),
    });

    const kommoSynced = kommoRes.ok;
    let kommoLeadId = null;
    if (kommoSynced) {
      try {
        const kommoData = await kommoRes.json();
        kommoLeadId = kommoData?.id || kommoData?._embedded?.leads?.[0]?.id || null;
      } catch {}
    }

    // Actualizar lead en Supabase
    await supabase
      .from("leads")
      .update({ kommo_synced: kommoSynced, kommo_lead_id: kommoLeadId?.toString() })
      .eq("id", lead_id);

    return new Response(JSON.stringify({ ok: true, kommo_synced: kommoSynced }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
