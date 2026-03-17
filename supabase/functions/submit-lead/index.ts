import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory rate limiter (per isolate lifetime)
const ipSubmissions = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 5; // max 5 submissions per IP per minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (ipSubmissions.get(ip) || []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT_MAX) return true;
  timestamps.push(now);
  ipSubmissions.set(ip, timestamps);
  return false;
}

// Validation helpers
const EMAIL_RE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

function validateLead(body: Record<string, unknown>): { valid: boolean; error?: string; data?: Record<string, unknown> } {
  const nombre = String(body.nombre || "").trim();
  const telefono = String(body.telefono || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const interes = String(body.interes || "").trim().slice(0, 200);
  const anio_raw = body.anio_nacimiento;
  const ahorro = body.ahorro_semanal ? String(body.ahorro_semanal).trim().slice(0, 50) : null;
  const honeypot = body.website_url;
  const form_loaded_at = Number(body.form_loaded_at || 0);

  // Honeypot
  if (honeypot) return { valid: false, error: "bot_detected" };

  // Minimum time (3s)
  if (form_loaded_at && Date.now() - form_loaded_at < 3000) return { valid: false, error: "bot_detected" };

  // Required fields
  if (nombre.length < 2 || nombre.length > 200) return { valid: false, error: "Nombre inválido (2-200 caracteres)" };
  if (telefono.length < 7 || telefono.length > 40) return { valid: false, error: "Teléfono inválido (7-40 caracteres)" };
  if (!EMAIL_RE.test(email) || email.length > 254) return { valid: false, error: "Email inválido" };

  // Optional fields
  let anio_nacimiento: number | null = null;
  if (anio_raw !== null && anio_raw !== undefined && anio_raw !== "") {
    anio_nacimiento = Number(anio_raw);
    if (isNaN(anio_nacimiento) || anio_nacimiento < 1900 || anio_nacimiento > 2100) {
      return { valid: false, error: "Año de nacimiento inválido" };
    }
  }

  const notas = body.notas ? String(body.notas).trim().slice(0, 2000) : `Año nacimiento: ${anio_nacimiento || 'N/A'} | Ahorro semanal: $${ahorro || 'N/A'}`;

  // UTM params
  const utmFields = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
  const utms: Record<string, string | null> = {};
  for (const key of utmFields) {
    const val = body[key];
    utms[key] = val ? String(val).trim().slice(0, 200) : null;
  }

  return {
    valid: true,
    data: {
      nombre,
      telefono,
      email,
      interes: interes || "",
      fuente: "landing-iul",
      referrer: body.referrer ? String(body.referrer).slice(0, 1000) : "",
      anio_nacimiento,
      ahorro_semanal: ahorro,
      notas,
      ...utms,
    },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                     req.headers.get("cf-connecting-ip") || 
                     "unknown";

    // Rate limit
    if (isRateLimited(clientIp)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Demasiadas solicitudes. Intenta en un minuto." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const validation = validateLead(body);

    if (!validation.valid) {
      // Silent success for bots
      if (validation.error === "bot_detected") {
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(
        JSON.stringify({ ok: false, error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const leadData = validation.data!;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Insert lead with service role (bypasses RLS)
    const leadId = crypto.randomUUID();
    const { error: insertError } = await supabase
      .from("leads")
      .insert({
        id: leadId,
        ...leadData,
        ip_address: clientIp,
        user_agent: req.headers.get("user-agent")?.slice(0, 500) || null,
      });

    if (insertError) {
      console.error("Error inserting lead:", insertError);
      return new Response(
        JSON.stringify({ ok: false, error: "Error al guardar. Intenta de nuevo." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const created_at = new Date().toISOString();

    // n8n webhook (fire-and-forget)
    const N8N_WEBHOOK = Deno.env.get("N8N_WEBHOOK_URL");
    if (N8N_WEBHOOK) {
      const webhookPayload = {
        lead_id: leadId,
        nombre: leadData.nombre,
        telefono: leadData.telefono,
        email: leadData.email,
        interes: leadData.interes,
        anio_nacimiento: leadData.anio_nacimiento,
        ahorro_semanal: leadData.ahorro_semanal,
        fuente: "landing-iul",
        referrer: leadData.referrer,
        utm_source: leadData.utm_source || null,
        utm_medium: leadData.utm_medium || null,
        utm_campaign: leadData.utm_campaign || null,
        utm_content: leadData.utm_content || null,
        utm_term: leadData.utm_term || null,
        notas: leadData.notas,
        created_at,
      };

      fetch(N8N_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookPayload),
      }).catch((err) => console.warn("n8n webhook failed:", err));
    }

    // Kommo sync (fire-and-forget, reusing existing edge function logic inline)
    const KOMMO_WEBHOOK = Deno.env.get("KOMMO_WEBHOOK_URL");
    if (KOMMO_WEBHOOK) {
      const { data: lead } = await supabase
        .from("leads")
        .select("*")
        .eq("id", leadId)
        .single();

      if (lead) {
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

        fetch(KOMMO_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(kommoPayload),
        })
          .then(async (res) => {
            const kommoSynced = res.ok;
            let kommoLeadId = null;
            if (kommoSynced) {
              try {
                const d = await res.json();
                kommoLeadId = d?.id || d?._embedded?.leads?.[0]?.id || null;
              } catch {}
            }
            await supabase
              .from("leads")
              .update({ kommo_synced: kommoSynced, kommo_lead_id: kommoLeadId?.toString() })
              .eq("id", leadId);
          })
          .catch((err) => console.warn("Kommo sync failed:", err));
      }
    }

    return new Response(
      JSON.stringify({ ok: true, lead_id: leadId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("submit-lead error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "Error interno. Intenta de nuevo." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
