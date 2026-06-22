import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Rate limit: 60 requests/min per IP (heartbeats every 10s = max ~6/min per tab)
const ipHits = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 60;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (ipHits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_MAX) return true;
  hits.push(now);
  ipHits.set(ip, hits);
  return false;
}

// ── Validation helpers ──────────────────────────────────────────────────────

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUUID(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

function safeStr(v: unknown, max: number): string | null {
  if (v == null || v === "") return null;
  return String(v).trim().slice(0, max) || null;
}

function safeNum(v: unknown, min: number, max: number): number | null {
  const n = Number(v);
  if (isNaN(n) || n < min || n > max) return null;
  return n;
}

// ── IP anonymisation ────────────────────────────────────────────────────────

function anonymizeIp(ip: string): string {
  // IPv4: remove last octet → "1.2.3.x"
  const v4 = ip.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/);
  if (v4) return `${v4[1]}.0`;
  // IPv6: keep first 3 groups → "2001:db8:1::"
  const parts = ip.split(":");
  if (parts.length >= 3) return `${parts.slice(0, 3).join(":")}::`;
  return "0.0.0.0";
}

// ── Event types ─────────────────────────────────────────────────────────────

type EventType = "pageview" | "heartbeat" | "exit" | "click" | "section_time";

interface RawEvent {
  type: EventType;
  occurred_at?: number; // Unix ms, optional (defaults to now)
  data?: Record<string, unknown>;
}

interface Payload {
  session_id: string;
  visitor_id: string;
  pageview_id: string;
  path: string;
  events: RawEvent[];
}

function validatePayload(
  body: unknown
): { ok: true; payload: Payload } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Invalid body" };
  }
  const b = body as Record<string, unknown>;

  if (!isUUID(b.session_id)) return { ok: false, error: "Invalid session_id" };
  if (!isUUID(b.visitor_id)) return { ok: false, error: "Invalid visitor_id" };
  if (!isUUID(b.pageview_id))
    return { ok: false, error: "Invalid pageview_id" };

  const path = safeStr(b.path, 200);
  if (!path) return { ok: false, error: "Invalid path" };

  if (!Array.isArray(b.events) || b.events.length === 0) {
    return { ok: false, error: "events must be a non-empty array" };
  }
  if (b.events.length > 100) {
    return { ok: false, error: "Too many events (max 100)" };
  }

  const VALID_TYPES = new Set<EventType>([
    "pageview",
    "heartbeat",
    "exit",
    "click",
    "section_time",
  ]);

  for (const ev of b.events) {
    if (typeof ev !== "object" || ev === null) {
      return { ok: false, error: "Each event must be an object" };
    }
    if (!VALID_TYPES.has((ev as RawEvent).type)) {
      return { ok: false, error: `Unknown event type: ${(ev as RawEvent).type}` };
    }
  }

  return {
    ok: true,
    payload: {
      session_id: b.session_id as string,
      visitor_id: b.visitor_id as string,
      pageview_id: b.pageview_id as string,
      path,
      events: b.events as RawEvent[],
    },
  };
}

// ── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";

  if (isRateLimited(clientIp)) {
    return new Response(
      JSON.stringify({ ok: false, error: "Rate limit exceeded" }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const validation = validatePayload(body);
  if (!validation.ok) {
    return new Response(JSON.stringify({ ok: false, error: validation.error }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { session_id, visitor_id, pageview_id, path, events } =
    validation.payload;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SB_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const ipAnon = clientIp !== "unknown" ? anonymizeIp(clientIp) : null;
  const now = new Date().toISOString();

  // ── Process events ──────────────────────────────────────────────────────

  // Collect values that will be upserted at the end
  let sessionMeta: Record<string, string | null> | null = null;
  let activeTimeMs = 0;
  let maxScrollPct = 0;
  const rawEvents: Array<{
    session_id: string;
    visitor_id: string;
    path: string;
    type: string;
    occurred_at: string;
    data: Record<string, unknown>;
  }> = [];

  for (const ev of events) {
    const ts = ev.occurred_at
      ? new Date(ev.occurred_at).toISOString()
      : now;
    const data = ev.data ?? {};

    switch (ev.type) {
      case "pageview": {
        // Capture session metadata from the first pageview event
        sessionMeta = {
          referrer: safeStr(data.referrer, 500),
          user_agent: safeStr(data.user_agent, 500),
          utm_source: safeStr(data.utm_source, 200),
          utm_medium: safeStr(data.utm_medium, 200),
          utm_campaign: safeStr(data.utm_campaign, 200),
        };
        break;
      }

      case "heartbeat":
      case "exit": {
        const ms = safeNum(data.active_ms, 0, 86_400_000); // max 24h
        const scroll = safeNum(data.scroll_pct, 0, 100);
        if (ms !== null && ms > activeTimeMs) activeTimeMs = ms;
        if (scroll !== null && scroll > maxScrollPct) maxScrollPct = scroll;
        break;
      }

      case "click": {
        const xPct = safeNum(data.x_pct, 0, 100);
        const yPct = safeNum(data.y_pct, 0, 100);
        if (xPct === null || yPct === null) break;
        rawEvents.push({
          session_id,
          visitor_id,
          path,
          type: "click",
          occurred_at: ts,
          data: {
            selector: safeStr(data.selector, 200),
            x_pct: xPct,
            y_pct: yPct,
          },
        });
        break;
      }

      case "section_time": {
        const section = safeStr(data.section, 100);
        const ms = safeNum(data.active_ms, 0, 86_400_000);
        if (!section || ms === null || ms <= 0) break;
        rawEvents.push({
          session_id,
          visitor_id,
          path,
          type: "section_time",
          occurred_at: ts,
          data: { section, active_ms: ms },
        });
        break;
      }
    }
  }

  // ── Upsert session ──────────────────────────────────────────────────────

  const sessionRow: Record<string, unknown> = {
    id: session_id,
    visitor_id,
    last_seen_at: now,
    entry_path: path,
    ip_anon: ipAnon,
  };
  if (sessionMeta) {
    Object.assign(sessionRow, sessionMeta);
  }

  const { error: sessErr } = await supabase
    .from("analytics_sessions")
    .upsert(sessionRow, {
      onConflict: "id",
      ignoreDuplicates: false,
    });

  if (sessErr) {
    console.error("Session upsert error:", sessErr);
    return new Response(
      JSON.stringify({ ok: false, error: "DB error (session)" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── Upsert pageview ─────────────────────────────────────────────────────
  // Use GREATEST so retried beacons don't overwrite a higher value.

  const { error: pvErr } = await supabase.rpc("analytics_upsert_pageview", {
    p_id: pageview_id,
    p_session_id: session_id,
    p_visitor_id: visitor_id,
    p_path: path,
    p_active_ms: activeTimeMs,
    p_scroll_pct: maxScrollPct,
  });

  if (pvErr) {
    console.error("Pageview upsert error:", pvErr);
    // Non-fatal: continue inserting events
  }

  // ── Insert raw events (clicks, section_time) ────────────────────────────

  if (rawEvents.length > 0) {
    const { error: evErr } = await supabase
      .from("analytics_events")
      .insert(rawEvents);

    if (evErr) {
      console.error("Events insert error:", evErr);
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
