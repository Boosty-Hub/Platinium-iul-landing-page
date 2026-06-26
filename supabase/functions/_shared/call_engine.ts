// ════════════════════════════════════════════════════════════════════════════
// Motor de llamadas (Fase 2) — secuencial por orden, asignación automática.
//
// Flujo por lead encolado, en horario laboral:
//   1) suena el asesor #1 (RingOut from=asesor → to=cliente); si no contesta,
//      se cancela y suena el #2, #3… (rotación resumible entre ticks).
//   2) cuando un asesor contesta, RingCentral marca al cliente:
//        · cliente contesta → CONTACTADO: se asigna el asesor en Kommo
//          (campo "Responsable" por enum + usuario nativo si matchea) y Status Call.
//        · cliente no contesta → se reencola con delay creciente hasta N intentos;
//          agotados → etapa "no contestó llamada" + Status Call = call_no_answer.
//   3) ningún asesor contesta → se reencola (no cuenta como intento de cliente).
// Fuera de horario → se reprograma al próximo horario de apertura.
// ════════════════════════════════════════════════════════════════════════════

import { rcAuth, getIntegracion, procesarLead, adminClient } from "./integraciones.ts";
import type { KommoCfg, RCCfg, LeadData } from "./integraciones.ts";

type Admin = ReturnType<typeof adminClient>;

// ── utils ─────────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const nowIso = () => new Date().toISOString();
const plusMin = (m: number) => new Date(Date.now() + m * 60_000).toISOString();

export function normalizePhone(p?: string | null): string | null {
  if (!p) return null;
  const t = String(p).trim();
  if (t.startsWith("+")) return "+" + t.slice(1).replace(/\D/g, "");
  const d = t.replace(/\D/g, "");
  if (d.length === 10) return "+1" + d;           // US sin código
  if (d.length === 11 && d.startsWith("1")) return "+" + d;
  return d ? "+" + d : null;
}

function parseMaybe<T>(v: unknown, fb: T): T {
  if (v == null) return fb;
  if (typeof v === "string") { try { return JSON.parse(v) as T; } catch { return fb; } }
  return v as T;
}

// ── Horario laboral (timezone-aware) ──────────────────────────────────────────
export interface Horario {
  timezone: string;
  schedule: Record<string, { abre: string; cierra: string; activo: boolean }>;
  client_retry_delays_min: number[];
  max_client_attempts: number;        // derivado = client_retry_delays_min.length
  advisor_ring_timeout_sec: number;
  weekly_recontact: boolean;          // tras agotar reintentos → 1×/semana hasta contactar
  daily_dial_cap: number;             // máx marcaciones al cliente por día por lead
  weekly_dial_cap: number;            // máx marcaciones al cliente por semana por lead
}

export function parseHorario(config: Record<string, unknown>): Horario {
  const delays = parseMaybe(config.client_retry_delays_min, [5, 15, 30]) as number[];
  return {
    timezone: (config.timezone as string) || "America/New_York",
    schedule: parseMaybe(config.schedule, {} as Horario["schedule"]),
    client_retry_delays_min: delays,
    // Máx intentos = cantidad de reintentos configurados (auto). Fallback al guardado.
    max_client_attempts: delays.length || Number(parseMaybe(config.max_client_attempts, 3)) || 3,
    advisor_ring_timeout_sec: Number(parseMaybe(config.advisor_ring_timeout_sec, 30)) || 30,
    weekly_recontact: String(parseMaybe(config.weekly_recontact, false)) === "true",
    daily_dial_cap: Number(parseMaybe(config.daily_dial_cap, 6)) || 6,
    weekly_dial_cap: Number(parseMaybe(config.weekly_dial_cap, 18)) || 18,
  };
}

const DOW = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
const WD: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const hm = (t: string) => { const [h, m] = String(t).split(":").map(Number); return (h || 0) * 60 + (m || 0); };

function tzParts(tz: string, at: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, weekday: "short", hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).formatToParts(at);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
  let hour = parseInt(get("hour"), 10); if (hour === 24) hour = 0;
  return { dow: WD[get("weekday")] ?? 0, hour, minute: parseInt(get("minute"), 10), y: +get("year"), mo: +get("month"), d: +get("day") };
}

// Convierte un wall-clock de una timezone a UTC (maneja DST vía round-trip).
function zonedToUtc(y: number, mo: number, d: number, h: number, mi: number, tz: string): Date {
  const guess = Date.UTC(y, mo - 1, d, h, mi, 0);
  const back = new Date(new Date(guess).toLocaleString("en-US", { timeZone: tz })).getTime();
  return new Date(guess + (guess - back));
}

export function horarioStatus(h: Horario, at: Date = new Date()): { open: boolean; nextOpen: Date } {
  const now = tzParts(h.timezone, at);
  const nowMin = now.hour * 60 + now.minute;
  const today = h.schedule[DOW[now.dow]];
  if (today?.activo && nowMin >= hm(today.abre) && nowMin < hm(today.cierra)) return { open: true, nextOpen: at };

  for (let off = 0; off <= 8; off++) {
    const dow = (now.dow + off) % 7;
    const day = h.schedule[DOW[dow]];
    if (!day?.activo) continue;
    const openMin = hm(day.abre);
    if (off === 0 && nowMin >= openMin) continue; // hoy ya pasó la apertura (cerrado)
    const dayDate = tzParts(h.timezone, new Date(at.getTime() + off * 86_400_000));
    const dt = zonedToUtc(dayDate.y, dayDate.mo, dayDate.d, Math.floor(openMin / 60), openMin % 60, h.timezone);
    if (dt.getTime() > at.getTime()) return { open: false, nextOpen: dt };
  }
  return { open: false, nextOpen: new Date(at.getTime() + 3_600_000) };
}

// ── Topes de marcaciones por lead (frena el sobre-marcado) ────────────────────
// Una "marcación al cliente" = un intento advisor_answered (el asesor aceptó y el
// softphone marcó). Contamos esos por día/semana para no saturar al lead.
function startOfDayIso(tz: string, at: Date = new Date()): string {
  const p = tzParts(tz, at);
  return zonedToUtc(p.y, p.mo, p.d, 0, 0, tz).toISOString();
}
function startOfNextDayIso(tz: string): string {
  const p = tzParts(tz, new Date(Date.now() + 86_400_000));
  return zonedToUtc(p.y, p.mo, p.d, 0, 1, tz).toISOString();
}
async function countDials(admin: Admin, leadId: string, sinceIso: string): Promise<number> {
  const { count } = await admin
    .from("call_attempts")
    .select("id", { count: "exact", head: true })
    .eq("lead_id", leadId)
    .eq("estado", "advisor_answered")
    .gte("inicio_at", sinceIso);
  return count ?? 0;
}
// Cuándo reintentar un lead respetando los topes diario/semanal. Devuelve el ISO y
// el motivo: "reintento" (usa baseDelayMin) | "cap_diario" (mañana) | "cap_semanal".
export async function nextRetryAt(
  admin: Admin, leadId: string, baseDelayMin: number, horario: Horario,
): Promise<{ at: string; reason: string }> {
  if (horario.weekly_dial_cap > 0) {
    const dWeek = await countDials(admin, leadId, new Date(Date.now() - 7 * 86_400_000).toISOString());
    if (dWeek >= horario.weekly_dial_cap) return { at: new Date(Date.now() + 7 * 86_400_000).toISOString(), reason: "cap_semanal" };
  }
  if (horario.daily_dial_cap > 0) {
    const dToday = await countDials(admin, leadId, startOfDayIso(horario.timezone));
    if (dToday >= horario.daily_dial_cap) return { at: startOfNextDayIso(horario.timezone), reason: "cap_diario" };
  }
  return { at: plusMin(baseDelayMin), reason: "reintento" };
}

// ── Kommo: asignación de Responsable + Status Call + etapa ────────────────────
function kommoBase(cfg: KommoCfg) { return `https://${cfg.subdominio}.kommo.com/api/v4`; }

interface CallFields { responsable_field_id?: string; status_call_field_id?: string; status_call?: Record<string, string>; }
function getCallFields(cfg: KommoCfg): CallFields {
  const cf = (cfg as unknown as { call_fields?: unknown }).call_fields;
  return parseMaybe<CallFields>(cf, {});
}
export function statusCallEnum(cfg: KommoCfg, key: string): string | null {
  return getCallFields(cfg).status_call?.[key] ?? null;
}

export async function kommoUpdateLead(
  cfg: KommoCfg,
  kommoLeadId: string,
  opts: { responsableEnumId?: string | null; statusCallEnumId?: string | null; responsibleUserId?: string | null; stageStatusId?: string | null },
) {
  const cf = getCallFields(cfg);
  const cfv: Record<string, unknown>[] = [];
  if (opts.responsableEnumId && cf.responsable_field_id)
    cfv.push({ field_id: Number(cf.responsable_field_id), values: [{ enum_id: Number(opts.responsableEnumId) }] });
  if (opts.statusCallEnumId && cf.status_call_field_id)
    cfv.push({ field_id: Number(cf.status_call_field_id), values: [{ enum_id: Number(opts.statusCallEnumId) }] });
  const body: Record<string, unknown> = {};
  if (cfv.length) body.custom_fields_values = cfv;
  if (opts.responsibleUserId) body.responsible_user_id = Number(opts.responsibleUserId);
  if (opts.stageStatusId) body.status_id = Number(opts.stageStatusId);
  if (!Object.keys(body).length) return;
  const res = await fetch(`${kommoBase(cfg)}/leads/${kommoLeadId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${cfg.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const t = await res.text(); throw new Error(`Kommo update ${res.status}: ${t.slice(0, 200)}`); }
}

// ── RingCentral RingOut (from/to explícitos) ──────────────────────────────────
// fromExt: si se pasa la extensión del asesor, el RingOut suena en SU extensión
// (incluido el softphone del navegador), no en un número personal.
async function rcRingOutCreate(rc: RCCfg, token: string, from: string, to: string): Promise<string> {
  // `from` es el DirectNumber de la extensión del asesor (ej: +16893082874 = ext 110),
  // así que marcar a ese phoneNumber hace sonar SU softphone/extensión — NO un número
  // personal. NO se pasa extensionNumber: RingOut lo rechaza (CMN-101 "no es válido")
  // y no hace falta, el número ya identifica la extensión.
  const fromObj = { phoneNumber: from };
  const res = await fetch(`${rc.server_url}/restapi/v1.0/account/~/extension/~/ring-out`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: fromObj, to: { phoneNumber: to }, playPrompt: false }),
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(`RingOut ${res.status}: ${txt.slice(0, 200)}`);
  return JSON.parse(txt)?.id as string;
}
async function rcRingOutStatus(rc: RCCfg, token: string, id: string): Promise<Record<string, string> | null> {
  const res = await fetch(`${rc.server_url}/restapi/v1.0/account/~/extension/~/ring-out/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  return (await res.json())?.status ?? null;
}
async function rcRingOutCancel(rc: RCCfg, token: string, id: string) {
  try { await fetch(`${rc.server_url}/restapi/v1.0/account/~/extension/~/ring-out/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }); } catch { /* best-effort */ }
}

// Espera el resultado de una pata (caller=asesor, callee=cliente).
async function pollLeg(rc: RCCfg, token: string, id: string, leg: "caller" | "callee", timeoutSec: number): Promise<string> {
  const field = leg === "caller" ? "callerStatus" : "calleeStatus";
  const deadline = Date.now() + timeoutSec * 1000;
  let last = "InProgress";
  while (Date.now() < deadline) {
    await sleep(2000);
    const st = await rcRingOutStatus(rc, token, id).catch(() => null);
    if (!st) continue;
    last = st[field] ?? last;
    if (last && last !== "InProgress") return last;
    if (["CannotReach", "Busy", "Rejected", "GenericError", "Error", "NoAnswer", "Voicemail", "Finished"].includes(st.callStatus)) {
      return last !== "InProgress" ? last : st.callStatus;
    }
  }
  return last; // "InProgress" ⇒ sin respuesta
}

// ── DB helpers ────────────────────────────────────────────────────────────────
async function setQueue(admin: Admin, id: string, patch: Record<string, unknown>) {
  await admin.from("call_queue").update(patch).eq("id", id);
}
async function logAttempt(admin: Admin, item: { id: string; lead_id: string }, asesorId: string, ringoutId: string | null): Promise<string> {
  const row: Record<string, unknown> = {
    call_queue_id: item.id, lead_id: item.lead_id, asesor_id: asesorId,
    tipo: "queue_ring", estado: "initiated",
  };
  if (ringoutId) row.rc_ringout_id = ringoutId;
  const { data } = await admin.from("call_attempts").insert(row).select("id").single();
  return data?.id as string;
}
async function updAttempt(admin: Admin, id: string | null, patch: Record<string, unknown>) {
  if (!id) return;
  await admin.from("call_attempts").update(patch).eq("id", id);
}

// Avisa al asesor que SU pop-up de llamada ya no aplica (no contestó → pasó al
// siguiente, o el intento terminó). El Cockpit lo escucha y cierra el pop-up.
// Fire-and-forget: nunca bloquea el loop.
function broadcastCancel(admin: Admin, asesorId: string, attemptId: string | null, leadId: string) {
  void (async () => {
    try {
      const ch = admin.channel("advisor:" + asesorId);
      await ch.subscribe();
      await ch.send({ type: "broadcast", event: "call_cancelled", payload: { attempt_id: attemptId, lead_id: leadId } });
      await admin.removeChannel(ch);
    } catch (e) { console.error("broadcast call_cancelled", e); }
  })();
}

// ── Dial de un item de la cola ────────────────────────────────────────────────
interface QueueItem {
  id: string; lead_id: string; kommo_lead_id: string | null;
  client_attempts: number; next_asesor_idx: number; advisor_round: number;
  solo_asesor_id: string | null;
}

// Extensiones que están EN una llamada ahora mismo (no se les marca).
// Un solo request a RingCentral devuelve el estado telefónico de todas.
// Falla "abierto": si no se puede leer, no salta a nadie (mejor marcar que no marcar).
async function rcBusyExtensions(rc: RCCfg, token: string): Promise<Set<string>> {
  try {
    const res = await fetch(`${rc.server_url}/restapi/v1.0/account/~/presence?detailedTelephonyState=true&perPage=250`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return new Set();
    const data = await res.json();
    const busy = new Set<string>();
    for (const r of (data?.records ?? [])) {
      const ext = r?.extension?.extensionNumber;
      const tel = r?.telephonyStatus; // NoCall | CallConnected | Ringing | OnHold | ...
      if (ext && tel && tel !== "NoCall") busy.add(String(ext));
    }
    return busy;
  } catch { return new Set(); }
}

// ── Claim autoritativo al ACEPTAR (event-driven) ──────────────────────────────
// Lo invoca asesor-accept-lead cuando el asesor toca "Contestar" (y el motor como
// backstop). Es la ÚNICA fuente de verdad de "quién tomó el lead": NO depende de
// que el motor esté vivo polleando. Hace un claim cuasi-atómico (primero gana) para
// que dos asesores no terminen ambos asignados al mismo lead.
export async function claimLeadOnAccept(
  admin: Admin,
  attempt: { id: string; asesor_id: string; lead_id: string; inicio_at?: string | null; accepted_at?: string | null },
  kommo: KommoCfg | null,
): Promise<{ claimed: boolean; reason?: string }> {
  // ¿La cola ya la tomó OTRO asesor? → este accept llega tarde.
  const { data: q } = await admin
    .from("call_queue")
    .select("id, estado, asesor_id, kommo_lead_id")
    .eq("lead_id", attempt.lead_id)
    .maybeSingle();
  if (q && q.estado === "in_progress" && q.asesor_id && q.asesor_id !== attempt.asesor_id) {
    await admin.from("call_attempts").update({
      estado: "no_answer", outcome: "cancelled", fin_at: nowIso(), notas: "otro_asesor_tomo",
    }).eq("id", attempt.id);
    return { claimed: false, reason: "otro_asesor" };
  }

  const acceptedAt = attempt.accepted_at || nowIso();
  const ringSec = attempt.inicio_at
    ? Math.min(Math.max(Math.round((new Date(acceptedAt).getTime() - new Date(attempt.inicio_at).getTime()) / 1000), 0), 600)
    : null;

  // Transición del intento: el asesor SÍ atendió (registra cuánto timbró).
  // outcome se deja NULL (no existe 'en_curso' en el CHECK de outcome); el resultado
  // real del cliente lo sella la disposición (client_no_answer / contactado). Chequeamos
  // el error: un UPDATE que falla en silencio fue justo el bug que dejaba "Llamando…".
  const { error: attErr } = await admin.from("call_attempts").update({
    estado: "advisor_answered", accepted_at: acceptedAt, answered_at: acceptedAt,
    ring_time_sec: ringSec,
  }).eq("id", attempt.id);
  if (attErr) console.error("claimLeadOnAccept/attempt update:", attErr.message);

  // Reclamar la cola para este asesor (queda "en curso" hasta la disposición).
  await admin.from("call_queue").update({
    estado: "in_progress", asesor_id: attempt.asesor_id, next_asesor_idx: 0, ultimo_resultado: "asesor_atendio",
  }).eq("lead_id", attempt.lead_id);

  // Cancela cualquier OTRO pop-up vivo del mismo lead (carrera rara: el motor alcanzó
  // a ofrecérselo a otro asesor justo cuando este aceptó). Evita "Llamando…" huérfanos.
  await admin.from("call_attempts")
    .update({ estado: "no_answer", outcome: "cancelled", fin_at: nowIso(), notas: "lead_tomado_por_otro" })
    .eq("lead_id", attempt.lead_id)
    .eq("estado", "initiated")
    .neq("id", attempt.id);

  // Kommo: Responsable + Status Call "calling" (best-effort, no rompe el claim).
  if (kommo && q?.kommo_lead_id) {
    try {
      const { data: asesor } = await admin
        .from("asesores")
        .select("kommo_responsable_enum_id, kommo_user_id")
        .eq("id", attempt.asesor_id)
        .maybeSingle();
      await kommoUpdateLead(kommo, q.kommo_lead_id as string, {
        responsableEnumId: asesor?.kommo_responsable_enum_id ?? null,
        responsibleUserId: asesor?.kommo_user_id ?? null,
        statusCallEnumId: statusCallEnum(kommo, "calling"),
      });
    } catch (e) { console.error("claimLeadOnAccept/kommo", (e as Error).message); }
  }
  return { claimed: true };
}

async function dialItem(admin: Admin, item: QueueItem, ctx: { rc: RCCfg; kommo: KommoCfg | null; horario: Horario }) {
  const { kommo, horario } = ctx;

  // Load lead with full snapshot for Realtime broadcast payload
  // OJO: la tabla leads NO tiene columna `edad` (solo `anio_nacimiento`). Seleccionar
  // `edad` hacía fallar TODA la query → lead=null → "sin_telefono" en cada lead.
  // El pop-up del asesor deriva la edad de anio_nacimiento, así que no hace falta `edad`.
  const { data: lead } = await admin.from("leads").select(
    "id, telefono, nombre, interes, anio_nacimiento, genero, ahorro_semanal, city, fuente, utm_source"
  ).eq("id", item.lead_id).single();
  const client = normalizePhone(lead?.telefono);
  if (!client) { await setQueue(admin, item.id, { estado: "failed", ultimo_resultado: "sin_telefono" }); return { lead: item.lead_id, action: "failed_no_phone" }; }

  // Cuánto suena el pop-up de un asesor antes de pasar al siguiente (configurable).
  const ACCEPT_WAIT_SEC = Math.min(Math.max(horario.advisor_ring_timeout_sec || 18, 10), 45);

  // ── 1) Resolver el intento ANTERIOR que estaba sonando (event-driven) ──────
  // El motor NO bloquea esperando el "Contestar": ofrece y vuelve enseguida. La
  // señal de aceptación la captura asesor-accept-lead (claimLeadOnAccept), viva o
  // muerta la función. Acá, en el siguiente tick (cuando ya venció el ring porque
  // scheduled_at = deadline), cerramos el intento previo de ESTE lead:
  //   · si aceptó → backstop (por si el endpoint no alcanzó a transicionar)
  //   · si venció sin aceptar → "el asesor no contestó" + rota al siguiente
  const { data: prev } = await admin
    .from("call_attempts")
    .select("id, asesor_id, inicio_at, accepted_at")
    .eq("call_queue_id", item.id)
    .eq("estado", "initiated")
    .order("inicio_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (prev) {
    if (prev.accepted_at) {
      const r = await claimLeadOnAccept(admin, {
        id: prev.id as string, asesor_id: prev.asesor_id as string, lead_id: item.lead_id,
        inicio_at: prev.inicio_at as string | null, accepted_at: prev.accepted_at as string,
      }, kommo);
      if (r.claimed) return { lead: item.lead_id, action: "asesor_atendio_backstop" };
    } else {
      const ringSec = prev.inicio_at
        ? Math.min(Math.round((Date.now() - new Date(prev.inicio_at as string).getTime()) / 1000), 600)
        : ACCEPT_WAIT_SEC;
      await updAttempt(admin, prev.id as string, {
        estado: "no_answer", outcome: "advisor_no_answer", notas: "asesor_no_acepto",
        fin_at: nowIso(), ring_time_sec: ringSec,
      });
      broadcastCancel(admin, prev.asesor_id as string, prev.id as string, item.lead_id);
    }
  }

  // ── 1b) Tope de marcaciones por lead — no saturar al cliente ───────────────
  // Si ya alcanzó el máximo del día/semana, se empuja a mañana / próxima semana en
  // vez de ofrecerlo (y de paso liberamos al asesor para otros leads).
  const cap = await nextRetryAt(admin, item.lead_id, 0, horario);
  if (cap.reason !== "reintento") {
    await setQueue(admin, item.id, { estado: "scheduled", scheduled_at: cap.at, next_asesor_idx: 0, ultimo_resultado: cap.reason });
    return { lead: item.lead_id, action: cap.reason };
  }

  // ── 2) Asesores + compuertas (presencia, ocupado, ring activo, pin) ────────
  let { data: asesores } = await admin.from("asesores").select("*").eq("activo", true).order("orden", { ascending: true });
  if (item.solo_asesor_id) {
    const pinned = (asesores ?? []).filter((a) => a.id === item.solo_asesor_id);
    if (pinned.length > 0) asesores = pinned; // recontacto fijado → SOLO ese asesor
    else console.log(`solo_asesor_id ${item.solo_asesor_id} no está activo — rotación normal`);
  }
  if (!asesores?.length) { await setQueue(admin, item.id, { estado: "scheduled", scheduled_at: plusMin(2), ultimo_resultado: "sin_asesores" }); return { lead: item.lead_id, action: "no_advisors" }; }

  // Presentes = Disponible + heartbeat fresco (<90s). Sin presencia no se ofrece.
  const { data: presenceRows } = await admin.from("advisor_presence").select("asesor_id, disponible, last_seen_at");
  const availableIds = new Set<string>();
  const freshThreshold = new Date(Date.now() - 90_000).toISOString();
  for (const row of (presenceRows ?? [])) {
    if (row.disponible && (row.last_seen_at as string) >= freshThreshold) availableIds.add(row.asesor_id as string);
  }

  // Ocupado = ya atendiendo un lead aceptado (in_progress con asesor_id).
  const { data: busyRows } = await admin.from("call_queue").select("asesor_id").eq("estado", "in_progress").not("asesor_id", "is", null);
  const busyIds = new Set<string>((busyRows ?? []).map((r) => r.asesor_id as string));
  // …y "sonando" = ya tiene un pop-up activo por OTRO lead (intento initiated sin vencer).
  // Evita que a un asesor le suenen dos leads a la vez.
  const ringFresh = new Date(Date.now() - (ACCEPT_WAIT_SEC + 5) * 1000).toISOString();
  const { data: ringingRows } = await admin
    .from("call_attempts").select("asesor_id, inicio_at")
    .eq("estado", "initiated").gte("inicio_at", ringFresh);
  for (const r of (ringingRows ?? [])) if (r.asesor_id) busyIds.add(r.asesor_id as string);

  // ── 3) Elegir el PRÓXIMO asesor elegible por rotación ──────────────────────
  const startIdx = item.next_asesor_idx ?? 0;
  let chosen: (typeof asesores)[number] | null = null;
  let chosenIdx = -1;
  for (let step = 0; step < asesores.length; step++) {
    const i = (startIdx + step) % asesores.length;
    const a = asesores[i];
    if (availableIds.has(a.id) && !busyIds.has(a.id)) { chosen = a; chosenIdx = i; break; }
  }

  if (!chosen) {
    // Nadie presente/libre → esperar a que alguien se desocupe (no quema rotación).
    await setQueue(admin, item.id, { estado: "scheduled", scheduled_at: plusMin(1), ultimo_resultado: prev ? "ningun_asesor_acepto" : "sin_asesores_presentes" });
    return { lead: item.lead_id, action: "no_eligible" };
  }

  // Tope suave: tras muchas rondas sin que NADIE acepte, espaciar (no repicar sin fin).
  const round = item.advisor_round ?? 0;
  if (round > 8) {
    await setQueue(admin, item.id, { estado: "scheduled", scheduled_at: plusMin(3), advisor_round: 0, next_asesor_idx: 0, ultimo_resultado: "ningun_asesor_acepto" });
    return { lead: item.lead_id, action: "backoff_rounds" };
  }

  // ── 4) Ofrecer (crea intento + broadcast) y volver: el ring corre solo ─────
  const attemptId = await logAttempt(admin, item, chosen.id, null);
  void (async () => {
    try {
      const ch = admin.channel("advisor:" + chosen!.id);
      await ch.subscribe();
      await ch.send({
        type: "broadcast",
        event: "incoming_call",
        payload: {
          attempt_id: attemptId,
          kommo_subdominio: (kommo as unknown as { subdominio?: string })?.subdominio ?? null,
          lead_id: item.lead_id,
          kommo_lead_id: item.kommo_lead_id ?? null,
          nombre: lead?.nombre ?? null,
          telefono: lead?.telefono ?? null,
          interes: lead?.interes ?? null,
          edad: lead?.anio_nacimiento ? new Date().getFullYear() - Number(lead.anio_nacimiento) : null,
          anio_nacimiento: lead?.anio_nacimiento ?? null,
          genero: lead?.genero ?? null,
          ahorro_semanal: lead?.ahorro_semanal ?? null,
          city: lead?.city ?? null,
          fuente: lead?.fuente ?? null,
          utm_source: lead?.utm_source ?? null,
          ts: nowIso(),
          es_seguimiento: !!item.solo_asesor_id,
        },
      });
      await admin.removeChannel(ch);
    } catch (e) { console.error("broadcast incoming_call", e); }
  })();

  // scheduled_at = deadline del ring: el lead NO se vuelve a tocar hasta que venza,
  // y al vencer el próximo tick resuelve este intento y rota. estado='scheduled'
  // (no in_progress) para no marcar al asesor como ocupado mientras solo le suena.
  const wrapped = chosenIdx + 1 >= asesores.length;
  await setQueue(admin, item.id, {
    estado: "scheduled",
    scheduled_at: new Date(Date.now() + ACCEPT_WAIT_SEC * 1000).toISOString(),
    next_asesor_idx: (chosenIdx + 1) % asesores.length,
    advisor_round: round + (wrapped ? 1 : 0),
    ultimo_resultado: "ofreciendo",
  });
  return { lead: item.lead_id, action: "ofrecido", asesor: chosen.nombre };
}

// ── Tick del motor (lo dispara el cron o submit-lead) ─────────────────────────
export async function processCallQueueTick(admin: Admin, opts: { maxItems?: number } = {}) {
  const [rcI, kommoI, horarioI, marcadoI] = await Promise.all([
    getIntegracion(admin, "ringcentral"),
    getIntegracion(admin, "kommo"),
    getIntegracion(admin, "horario"),
    getIntegracion(admin, "marcado"),
  ]);
  // Switch maestro de "Marcado automático" (Configuración). Default OFF si la fila
  // no existe → el motor NO marca hasta que un admin lo encienda explícitamente.
  // Desacopla "pausar marcado" de "RC configurado": RC puede quedar encendido
  // (softphone/entrantes/presencia siguen) y el marcado saliente, en pausa.
  if (!marcadoI?.activo) return { skipped: "marcado_pausado" };
  if (!rcI?.activo) return { skipped: "rc_inactivo" };

  const rc = rcI.config as unknown as RCCfg;
  const kommo = kommoI?.activo ? (kommoI.config as unknown as KommoCfg) : null;
  const horario = parseHorario((horarioI?.config as Record<string, unknown>) ?? {});
  const hstatus = horarioStatus(horario, new Date());

  // ── Reminder sweep: avisar seguimientos que vencen en los próximos 5 min ──
  try {
    const now = new Date();
    const in5min = new Date(now.getTime() + 5 * 60_000).toISOString();
    const { data: dueSegs } = await admin
      .from("seguimientos")
      .select("id, lead_id, asesor_id, programado_para, nota, leads(nombre)")
      .eq("estado", "pendiente")
      .not("programado_para", "is", null)
      .gte("programado_para", now.toISOString())
      .lte("programado_para", in5min);

    if (dueSegs && dueSegs.length > 0) {
      // Marcar como avisados antes de broadcast (evita doble aviso si tick demora)
      const ids = dueSegs.map((s) => s.id);
      await admin.from("seguimientos").update({ estado: "avisado" }).in("id", ids);

      for (const seg of dueSegs) {
        if (!seg.asesor_id) continue;
        void (async () => {
          try {
            const ch = admin.channel("advisor:" + seg.asesor_id);
            await ch.subscribe();
            await ch.send({
              type: "broadcast",
              event: "seguimiento_reminder",
              payload: {
                seguimiento_id: seg.id,
                lead_id: seg.lead_id,
                nombre: (seg.leads as { nombre?: string } | null)?.nombre ?? null,
                programado_para: seg.programado_para,
                nota: seg.nota,
              },
            });
            await admin.removeChannel(ch);
          } catch (e) { console.error("broadcast seguimiento_reminder", e); }
        })();
      }
    }
  } catch (e) {
    console.error("reminder sweep", (e as Error).message);
  }

  const { data: items } = await admin.from("call_queue")
    .select("id, lead_id, kommo_lead_id, client_attempts, next_asesor_idx, advisor_round, solo_asesor_id")
    .in("estado", ["pending", "scheduled"])
    .eq("auto_marcar", true) // solo auto-marcamos los leads habilitados (los migrados quedan manuales)
    .lte("scheduled_at", nowIso())
    .order("scheduled_at", { ascending: true })
    .limit(opts.maxItems ?? 1);
  if (!items?.length) return { processed: 0, open: hstatus.open };

  const results: unknown[] = [];
  for (const item of items as QueueItem[]) {
    if (!hstatus.open) {
      await setQueue(admin, item.id, { estado: "scheduled", scheduled_at: hstatus.nextOpen.toISOString(), ultimo_resultado: "fuera_horario" });
      results.push({ lead: item.lead_id, action: "reprogramado", nextOpen: hstatus.nextOpen });
      continue;
    }
    try { results.push(await dialItem(admin, item, { rc, kommo, horario })); }
    catch (e) {
      console.error("dialItem", (e as Error).message);
      await setQueue(admin, item.id, { estado: "scheduled", scheduled_at: plusMin(2), ultimo_resultado: `error: ${(e as Error).message.slice(0, 120)}` });
      results.push({ lead: item.lead_id, action: "error", error: (e as Error).message });
    }
  }
  return { processed: results.length, open: hstatus.open, results };
}

// ── Encolar un lead (lo usa submit-lead) ──────────────────────────────────────
// Crea en Kommo (sin llamar) y lo deja en la cola; el motor llama según horario.
export async function enqueueLead(admin: Admin, lead: LeadData): Promise<{ kommoLeadId: string | null }> {
  const r = await procesarLead(admin, lead, { llamar: false });
  const kommoLeadId = (r.kommo as { kommoLeadId?: string | null })?.kommoLeadId ?? null;
  await admin.from("call_queue").upsert(
    { lead_id: lead.id, kommo_lead_id: kommoLeadId, estado: "pending", scheduled_at: nowIso(), next_asesor_idx: 0, client_attempts: 0 },
    { onConflict: "lead_id" },
  );
  return { kommoLeadId };
}
