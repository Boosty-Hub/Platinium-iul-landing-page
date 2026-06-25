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
  max_client_attempts: number;
  advisor_ring_timeout_sec: number;
}

export function parseHorario(config: Record<string, unknown>): Horario {
  return {
    timezone: (config.timezone as string) || "America/New_York",
    schedule: parseMaybe(config.schedule, {} as Horario["schedule"]),
    client_retry_delays_min: parseMaybe(config.client_retry_delays_min, [5, 15, 30]),
    max_client_attempts: Number(parseMaybe(config.max_client_attempts, 3)) || 3,
    advisor_ring_timeout_sec: Number(parseMaybe(config.advisor_ring_timeout_sec, 30)) || 30,
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

async function dialItem(admin: Admin, item: QueueItem, ctx: { rc: RCCfg; kommo: KommoCfg | null; horario: Horario }) {
  const { kommo, horario } = ctx;

  // Load lead with full snapshot for Realtime broadcast payload
  // OJO: la tabla leads NO tiene columna `edad` (solo `anio_nacimiento`). Seleccionar
  // `edad` hacía fallar TODA la query → lead=null → "sin_telefono" en cada lead.
  // El pop-up del asesor deriva la edad de anio_nacimiento, así que no hace falta `edad`.
  const { data: lead } = await admin.from("leads").select(
    "id, telefono, nombre, interes, anio_nacimiento, ahorro_semanal, city, fuente, utm_source"
  ).eq("id", item.lead_id).single();
  const client = normalizePhone(lead?.telefono);
  if (!client) { await setQueue(admin, item.id, { estado: "failed", ultimo_resultado: "sin_telefono" }); return { lead: item.lead_id, action: "failed_no_phone" }; }

  let { data: asesores } = await admin.from("asesores").select("*").eq("activo", true).order("orden", { ascending: true });

  // ── Recontacto fijado a un asesor (solo_asesor_id) ──────────────────────
  if (item.solo_asesor_id) {
    const pinned = (asesores ?? []).filter((a) => a.id === item.solo_asesor_id);
    if (pinned.length > 0) {
      asesores = pinned; // llama SOLO al asesor asignado
    } else {
      // Asesor inactivo → rotación normal (log + fall-through)
      console.log(`solo_asesor_id ${item.solo_asesor_id} no está activo — rotación normal`);
    }
  }

  if (!asesores?.length) { await setQueue(admin, item.id, { estado: "scheduled", scheduled_at: plusMin(2), ultimo_resultado: "sin_asesores" }); return { lead: item.lead_id, action: "no_advisors" }; }

  // ── Presence gate (modelo click-to-call) ──────────────────────────────────
  // El asesor DEBE estar presente (app abierta + Disponible + heartbeat < 90s) para
  // poder ACEPTAR el lead y que su softphone marque al cliente. Por eso solo se
  // ofrece a quienes están realmente disponibles. Ya NO hay cold-start "todos
  // disponibles": si nadie está presente, no se ofrece a nadie y se reencola.
  const { data: presenceRows } = await admin
    .from("advisor_presence")
    .select("asesor_id, disponible, last_seen_at");

  const availableIds = new Set<string>();
  const freshThreshold = new Date(Date.now() - 90_000).toISOString();
  for (const row of (presenceRows ?? [])) {
    if (row.disponible && (row.last_seen_at as string) >= freshThreshold) {
      availableIds.add(row.asesor_id as string);
    }
  }

  // Compuerta de "ocupada": un asesor que YA está atendiendo un lead aceptado
  // (in_progress con asesor_id) no recibe otra oferta hasta cerrar la disposición.
  // Evita que las ofertas se pierdan con asesores ocupados.
  const { data: busyRows } = await admin
    .from("call_queue")
    .select("asesor_id")
    .eq("estado", "in_progress")
    .not("asesor_id", "is", null);
  const busyIds = new Set<string>((busyRows ?? []).map((r) => r.asesor_id as string));

  await setQueue(admin, item.id, { estado: "in_progress" });
  // Cuánto esperamos a que el asesor toque "Contestar" antes de pasar al siguiente.
  // Respeta el valor configurado (Configuración → Tiempo de ring del asesor),
  // con piso 10s y techo 45s (el presupuesto de 55s de la función lo cubre).
  const ACCEPT_WAIT_SEC = Math.min(Math.max(horario.advisor_ring_timeout_sec || 18, 10), 45);
  const BUDGET_MS = 55_000;
  const t0 = Date.now();

  for (let i = item.next_asesor_idx ?? 0; i < asesores.length; i++) {
    if (Date.now() - t0 > BUDGET_MS) {
      await setQueue(admin, item.id, { estado: "scheduled", scheduled_at: nowIso(), next_asesor_idx: i, ultimo_resultado: "continua_rotacion" });
      return { lead: item.lead_id, action: "budget_pause", resumeIdx: i };
    }
    const asesor = asesores[i];

    // Solo ofrecemos a asesores presentes (Disponible + heartbeat fresco)…
    if (!availableIds.has(asesor.id)) {
      console.log(`presence gate: skipping advisor ${asesor.nombre} (no presente)`);
      continue;
    }
    // …y que NO estén atendiendo otro lead ahora mismo.
    if (busyIds.has(asesor.id)) {
      console.log(`busy gate: skipping advisor ${asesor.nombre} (atendiendo otro lead)`);
      continue;
    }

    const attemptId = await logAttempt(admin, item, asesor.id, null);

    // ── Broadcast on ring ──────────────────────────────────────────────────
    // Fire-and-forget: NUNCA bloquea el loop (presupuesto 55s). Incluye
    // attempt_id (para que el asesor guarde la nota) y el subdominio de Kommo
    // (para el link "Abrir en Kommo" del pop-up).
    void (async () => {
      try {
        const ch = admin.channel("advisor:" + asesor.id);
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

    // ── Esperar a que el asesor ACEPTE (toque "Contestar" en su app) ──────────
    // Al aceptar, SU softphone marca al cliente (rc-adapter-new-call). El motor solo
    // necesita la señal: call_attempts.accepted_at, que pone el endpoint
    // asesor-accept-lead.
    const ringStartIso = nowIso();
    let accepted = false;
    const deadline = Date.now() + ACCEPT_WAIT_SEC * 1000;
    while (Date.now() < deadline) {
      await sleep(1500);
      const { data: a } = await admin.from("call_attempts").select("accepted_at").eq("id", attemptId).maybeSingle();
      if (a?.accepted_at) { accepted = true; break; }
    }

    if (!accepted) {
      const ringTimeSec = Math.round((Date.now() - new Date(ringStartIso).getTime()) / 1000);
      await updAttempt(admin, attemptId, {
        estado: "no_answer", notas: "asesor_no_acepto", fin_at: nowIso(),
        outcome: "advisor_no_answer", ring_time_sec: ringTimeSec,
      });
      // Cerrale el pop-up a ESTE asesor; el motor ofrece al siguiente.
      broadcastCancel(admin, asesor.id, attemptId, item.lead_id);
      continue; // siguiente asesor
    }

    // ── El asesor aceptó → su softphone está marcando al cliente ──────────────
    // El resultado real (contactado / no contactó / agendó) lo registra la
    // DISPOSICIÓN del asesor al colgar (asesor-set-disposicion → setDisposicion),
    // que finaliza la cola. El motor solo deja el lead "en curso" con su dueño.
    const acceptedAt = nowIso();
    const ringTimeSec = Math.round((new Date(acceptedAt).getTime() - new Date(ringStartIso).getTime()) / 1000);
    await updAttempt(admin, attemptId, {
      estado: "advisor_answered", answered_at: acceptedAt,
      ring_time_sec: ringTimeSec, outcome: "en_curso",
    });
    await setQueue(admin, item.id, { estado: "in_progress", asesor_id: asesor.id, next_asesor_idx: 0, ultimo_resultado: "asesor_atendio" });
    if (kommo && item.kommo_lead_id) {
      kommoUpdateLead(kommo, item.kommo_lead_id, {
        responsableEnumId: asesor.kommo_responsable_enum_id,
        responsibleUserId: asesor.kommo_user_id,
        statusCallEnumId: statusCallEnum(kommo, "calling"),
      }).catch((e) => console.error("kommo calling", e));
    }
    return { lead: item.lead_id, action: "asesor_atendio", asesor: asesor.nombre };
  }

  // Nadie aceptó → reencolar (no cuenta como intento de cliente).
  await setQueue(admin, item.id, { estado: "scheduled", scheduled_at: plusMin(2), next_asesor_idx: 0, advisor_round: (item.advisor_round ?? 0) + 1, ultimo_resultado: "ningun_asesor_acepto" });
  return { lead: item.lead_id, action: "no_advisor_accepted" };
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
