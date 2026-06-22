import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { procesarLead } from "../_shared/integraciones.ts";

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
  const fbclid = body.fbclid ? String(body.fbclid).trim().slice(0, 500) : null;

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
      fbclid,
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
      Deno.env.get("SB_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Resolve city/region from IP (best-effort). Try multiple providers.
    let city: string | null = null;
    let region: string | null = null;
    if (clientIp && clientIp !== "unknown") {
      const providers = [
        { url: `https://ipwho.is/${clientIp}`, city: "city", region: "region" },
        { url: `http://ip-api.com/json/${clientIp}?fields=status,city,regionName`, city: "city", region: "regionName" },
        { url: `https://ipapi.co/${clientIp}/json/`, city: "city", region: "region" },
      ];
      for (const p of providers) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);
          const geoRes = await fetch(p.url, { signal: controller.signal, headers: { "User-Agent": "Mozilla/5.0" } });
          clearTimeout(timeoutId);
          if (!geoRes.ok) { console.warn(`Geo ${p.url} status ${geoRes.status}`); continue; }
          const geo = await geoRes.json();
          if (geo.success === false || geo.error || geo.status === "fail") { console.warn(`Geo ${p.url} returned error:`, geo.message || geo.reason); continue; }
          city = geo[p.city] ? String(geo[p.city]).slice(0, 100) : null;
          region = geo[p.region] ? String(geo[p.region]).slice(0, 100) : null;
          if (city) { console.log(`Geo resolved via ${p.url}: ${city}, ${region}`); break; }
        } catch (e) {
          console.warn(`Geo lookup ${p.url} failed:`, e instanceof Error ? e.message : e);
        }
      }
    }

    // Insert lead with service role (bypasses RLS)
    const leadId = crypto.randomUUID();
    const { error: insertError } = await supabase
      .from("leads")
      .insert({
        id: leadId,
        ...leadData,
        ip_address: clientIp,
        user_agent: req.headers.get("user-agent")?.slice(0, 500) || null,
        city,
        region,
      });

    if (insertError) {
      console.error("Error inserting lead:", insertError);
      return new Response(
        JSON.stringify({ ok: false, error: "Error al guardar. Intenta de nuevo." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Procesar en background: crear en Kommo + llamada RingOut. No bloquea la respuesta.
    try {
      // @ts-ignore EdgeRuntime existe en el runtime de Supabase Edge
      EdgeRuntime.waitUntil(
        procesarLead(supabase, {
          id: leadId,
          nombre: String(leadData.nombre),
          telefono: String(leadData.telefono),
          email: String(leadData.email),
          interes: leadData.interes ? String(leadData.interes) : undefined,
        }),
      );
    } catch (e) {
      console.error("No se pudo agendar el procesamiento del lead:", e);
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
