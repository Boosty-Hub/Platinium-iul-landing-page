// Persist marketing attribution (UTMs, gclid, fbclid) across SPA navigation
// so they survive between landing and the form submission.

const STORAGE_KEY = "pi_attribution";
const TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

const KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
] as const;

type AttrKey = typeof KEYS[number];
type Attribution = Partial<Record<AttrKey, string>> & { _ts?: number };

function safeRead(): Attribution {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Attribution;
    if (parsed._ts && Date.now() - parsed._ts > TTL_MS) return {};
    return parsed;
  } catch {
    return {};
  }
}

function safeWrite(data: Attribution) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, _ts: Date.now() }));
  } catch {}
}

/** Capture UTMs/gclid/fbclid from current URL. Only persists if at least one is present. */
export function captureAttribution() {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const incoming: Attribution = {};
    let hasAny = false;
    for (const key of KEYS) {
      const val = params.get(key);
      if (val) {
        incoming[key] = val.slice(0, 500);
        hasAny = true;
      }
    }
    if (!hasAny) return;
    // First-touch attribution: don't overwrite existing values
    const existing = safeRead();
    const merged: Attribution = { ...incoming, ...existing };
    // But if existing was empty, this writes the new ones
    safeWrite(merged);
  } catch {}
}

/** Read stored attribution, falling back to current URL params if storage is empty. */
export function getStoredAttribution(): Record<string, string> {
  const stored = safeRead();
  const out: Record<string, string> = {};
  for (const key of KEYS) {
    const v = stored[key];
    if (v) out[key] = v;
  }
  if (Object.keys(out).length === 0 && typeof window !== "undefined") {
    try {
      const params = new URLSearchParams(window.location.search);
      for (const key of KEYS) {
        const val = params.get(key);
        if (val) out[key] = val.slice(0, 500);
      }
    } catch {}
  }
  return out;
}
