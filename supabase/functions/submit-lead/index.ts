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
  // Phone must start with + and have 8-18 digits total
  const phoneDigits = telefono.replace(/\D/g, "");
  if (phoneDigits.length < 8 || phoneDigits.length > 18) return { valid: false, error: "Teléfono inválido — incluye código de país y número completo" };
  if (!EMAIL_RE.test(email) || email.length > 254) return { valid: false, error: "Email inválido" };

  // Optional fields
  let anio_nacimiento: number | null = null;
  if (anio_raw !== null && anio_raw !== undefined && anio_raw !== "") {
    anio_nacimiento = Number(anio_raw);
    if (isNaN(anio_nacimiento) || anio_nacimiento < 1900 || anio_nacimiento > 2100) {
      return { valid: false, error: "Año de nacimiento inválido" };
    }
  }

  const genero = body.genero ? String(body.genero).trim().slice(0, 50) : null;
  const notas = body.notas ? String(body.notas).trim().slice(0, 2000) : `Año nacimiento: ${anio_nacimiento || 'N/A'} | Ahorro semanal: $${ahorro || 'N/A'} | Género: ${genero || 'N/A'}`;

  // UTM params
  const utmFields = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
  const utms: Record<string, string | null> = {};
  for (const key of utmFields) {
    const val = body[key];
    utms[key] = val ? String(val).trim().slice(0, 200) : null;
  }

  const gclid = body.gclid ? String(body.gclid).trim().slice(0, 500) : null;

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
      genero,
      notas,
      gclid,
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
        genero: leadData.genero,
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

    // Kommo sync is handled by n8n workflow, no need to send directly

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
