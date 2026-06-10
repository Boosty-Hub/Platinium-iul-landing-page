// First-party analytics collector.
// Call init() once from main.tsx after captureAttribution().
// Only runs when the user has accepted cookies (pig_cookies_accepted === "1").

import { getStoredAttribution } from "./attribution";

const ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ingest-event`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const CONSENT_KEY = "pig_cookies_accepted";
const VISITOR_KEY = "pi_vid";
const SESSION_KEY = "pi_sid";
const SESSION_TTL  = 30 * 60 * 1000;  // 30 min inactivity = new session
const HEARTBEAT_MS = 10_000;           // send heartbeat every 10s
const INACTIVITY_MS = 20_000;          // mark inactive after 20s no input
const FLUSH_MS = 30_000;               // batch flush interval

// ── Helpers ────────────────────────────────────────────────────────────────

function uuid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      });
}

function getOrCreate(key: string, ttl?: number): { id: string; fresh: boolean } {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const { id, ts } = JSON.parse(raw) as { id: string; ts: number };
      if (id && (!ttl || Date.now() - ts < ttl)) {
        localStorage.setItem(key, JSON.stringify({ id, ts: Date.now() }));
        return { id, fresh: false };
      }
    }
  } catch {}
  const id = uuid();
  localStorage.setItem(key, JSON.stringify({ id, ts: Date.now() }));
  return { id, fresh: true };
}

function scrollPct(): number {
  const el = document.documentElement;
  const max = el.scrollHeight - el.clientHeight;
  return max > 0 ? Math.round((el.scrollTop / max) * 100) : 0;
}

function getSelector(el: Element): string {
  const section = el.closest("[data-section]")?.getAttribute("data-section") ?? "";
  const prefix = section ? `[s:${section}] ` : "";
  if (el.id) return `${prefix}#${el.id}`;
  const tag = el.tagName.toLowerCase();
  const cls = Array.from(el.classList).slice(0, 2).join(".");
  return `${prefix}${cls ? `${tag}.${cls}` : tag}`;
}

// ── Module state ────────────────────────────────────────────────────────────

let running = false;
let visitorId = "";
let sessionId = "";
let pageviewId = "";
let path = "";

// Activity
let tabVisible = false;
let userActive = false;
let activeStart: number | null = null;
let activeMs = 0;
let maxScroll = 0;

// Section tracking (IntersectionObserver)
let sectionObserver: IntersectionObserver | null = null;
const visibleSections = new Set<string>();
const sectionStarts   = new Map<string, number>(); // section → active period start
const sectionMs       = new Map<string, number>(); // section → accumulated ms

// Event buffer (clicks + section_time go here before flush)
const buffer: Array<{ type: string; occurred_at: number; data: Record<string, unknown> }> = [];

let heartbeatTimer = 0;
let inactivityTimer = 0;
let flushTimer = 0;
let pageviewQueued = false;

// ── Active-time machine ─────────────────────────────────────────────────────

function startActivePeriod() {
  if (activeStart !== null) return; // already running
  activeStart = Date.now();
  for (const s of visibleSections) {
    if (!sectionStarts.has(s)) sectionStarts.set(s, activeStart);
  }
}

function pauseActivePeriod() {
  const now = Date.now();
  if (activeStart !== null) {
    activeMs += now - activeStart;
    activeStart = null;
  }
  for (const [s, t] of sectionStarts) {
    sectionMs.set(s, (sectionMs.get(s) ?? 0) + now - t);
  }
  sectionStarts.clear();
}

function onActivity() {
  maxScroll = Math.max(maxScroll, scrollPct());
  if (!userActive) {
    userActive = true;
    if (tabVisible) startActivePeriod();
  }
  clearTimeout(inactivityTimer);
  inactivityTimer = window.setTimeout(() => {
    userActive = false;
    pauseActivePeriod();
  }, INACTIVITY_MS);
}

// ── Flush / send ────────────────────────────────────────────────────────────

function buildAndSend(isExit: boolean) {
  const now = Date.now();

  // Snapshot active time
  let snap = activeMs;
  if (activeStart !== null) snap += now - activeStart;

  // Snapshot section times
  const sections: Record<string, number> = {};
  for (const [s, ms] of sectionMs) sections[s] = ms;
  for (const [s, t] of sectionStarts) {
    sections[s] = (sections[s] ?? 0) + (now - t);
  }

  const events = [...buffer];
  buffer.length = 0;

  // Section time events (only if > 500 ms to filter noise)
  for (const [section, ms] of Object.entries(sections)) {
    if (ms >= 500) {
      events.push({ type: "section_time", occurred_at: now, data: { section, active_ms: ms } });
    }
  }

  // Heartbeat or exit
  events.push({
    type: isExit ? "exit" : "heartbeat",
    occurred_at: now,
    data: { active_ms: snap, scroll_pct: maxScroll },
  });

  if (pageviewQueued) {
    const attr = getStoredAttribution();
    events.unshift({
      type: "pageview",
      occurred_at: now,
      data: {
        referrer: document.referrer || "",
        user_agent: navigator.userAgent.slice(0, 500),
        utm_source:   attr.utm_source   ?? "",
        utm_medium:   attr.utm_medium   ?? "",
        utm_campaign: attr.utm_campaign ?? "",
      },
    });
    pageviewQueued = false;
  }

  const payload = JSON.stringify({ session_id: sessionId, visitor_id: visitorId, pageview_id: pageviewId, path, events });

  if (isExit && navigator.sendBeacon) {
    // sendBeacon can't set headers → pass apikey as query param (Supabase supports it)
    navigator.sendBeacon(`${ENDPOINT}?apikey=${ANON_KEY}`, new Blob([payload], { type: "application/json" }));
  } else {
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": ANON_KEY },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }
}

function scheduleFlush() {
  clearInterval(flushTimer);
  flushTimer = window.setInterval(() => buildAndSend(false), FLUSH_MS);
}

// ── Section observer ────────────────────────────────────────────────────────

function setupSectionObserver() {
  sectionObserver?.disconnect();
  sectionMs.clear();
  sectionStarts.clear();
  visibleSections.clear();

  sectionObserver = new IntersectionObserver(
    (entries) => {
      const now = Date.now();
      for (const entry of entries) {
        const s = entry.target.getAttribute("data-section");
        if (!s) continue;
        if (entry.isIntersecting) {
          visibleSections.add(s);
          if (tabVisible && userActive && !sectionStarts.has(s)) {
            sectionStarts.set(s, now);
          }
        } else {
          visibleSections.delete(s);
          if (sectionStarts.has(s)) {
            sectionMs.set(s, (sectionMs.get(s) ?? 0) + now - sectionStarts.get(s)!);
            sectionStarts.delete(s);
          }
        }
      }
    },
    { threshold: 0.3 }
  );

  document.querySelectorAll("[data-section]").forEach((el) => sectionObserver!.observe(el));
}

// ── Page init (called on each SPA navigation) ───────────────────────────────

function initPage(newPath: string) {
  // Flush previous page before resetting
  if (path && path !== newPath) buildAndSend(true);

  path = newPath;
  pageviewId = uuid();
  activeMs = 0;
  maxScroll = 0;
  activeStart = null;
  pageviewQueued = true;

  userActive = true;
  clearTimeout(inactivityTimer);
  inactivityTimer = window.setTimeout(() => {
    userActive = false;
    pauseActivePeriod();
  }, INACTIVITY_MS);

  tabVisible = document.visibilityState === "visible";
  if (tabVisible) startActivePeriod();

  // Defer until React finishes painting the new page
  requestAnimationFrame(() => requestAnimationFrame(() => setupSectionObserver()));
  scheduleFlush();
  clearInterval(heartbeatTimer);
  heartbeatTimer = window.setInterval(() => {
    if (tabVisible && userActive) buildAndSend(false);
  }, HEARTBEAT_MS);
}

// ── Bootstrap ────────────────────────────────────────────────────────────────

function bootstrap() {
  if (running) return;
  running = true;

  const v = getOrCreate(VISITOR_KEY);
  const s = getOrCreate(SESSION_KEY, SESSION_TTL);
  visitorId = v.id;
  sessionId = s.id;

  // Visibility
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      tabVisible = false;
      pauseActivePeriod();
      buildAndSend(true);
    } else {
      tabVisible = true;
      if (userActive) startActivePeriod();
    }
  });

  // bfcache restore
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) initPage(location.pathname);
  });

  // Activity signals
  const ACTIVITY_EVENTS = ["mousemove", "keydown", "scroll", "touchstart", "touchmove"];
  ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));

  // Clicks
  document.addEventListener("click", (e) => {
    const target = e.target as Element;
    if (!target) return;
    const x = Math.round((e.clientX / window.innerWidth) * 100);
    const y = Math.round(
      ((e.clientY + window.scrollY) / Math.max(document.documentElement.scrollHeight, 1)) * 100
    );
    buffer.push({
      type: "click",
      occurred_at: Date.now(),
      data: { selector: getSelector(target), x_pct: x, y_pct: y },
    });
  }, true); // capture phase so we don't miss SPA-intercepted clicks

  // SPA navigation detection
  const origPush    = history.pushState.bind(history);
  const origReplace = history.replaceState.bind(history);
  history.pushState    = (...a) => { origPush(...a);    initPage(location.pathname); };
  history.replaceState = (...a) => { origReplace(...a); if (location.pathname !== path) initPage(location.pathname); };
  window.addEventListener("popstate", () => initPage(location.pathname));

  // Exit fallback
  window.addEventListener("pagehide", () => buildAndSend(true));

  initPage(location.pathname);
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Call once from main.tsx. No-op if consent not given yet; polls until granted. */
export function init() {
  if (typeof window === "undefined") return;

  if (localStorage.getItem(CONSENT_KEY) === "1") {
    bootstrap();
    return;
  }

  // Poll until user accepts cookies (up to 5 min)
  let tries = 0;
  const poll = setInterval(() => {
    tries++;
    if (localStorage.getItem(CONSENT_KEY) === "1") {
      clearInterval(poll);
      bootstrap();
    } else if (tries >= 300) {
      clearInterval(poll);
    }
  }, 1000);
}
