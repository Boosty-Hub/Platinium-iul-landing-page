// asesorApi.ts — advisor-scoped helpers (Slice 2).
// All calls use the asesor's authenticated session (RLS restricts data to own rows).
import { supabase } from "@/integrations/supabase/client";

// ── Presence / identity ──────────────────────────────────────────────────────

/** Returns the UUID of the currently authenticated asesor (from SECDEF RPC). */
export async function getCurrentAsesorId(): Promise<string | null> {
  const { data, error } = await (supabase as any).rpc("current_asesor_id");
  if (error) {
    console.error("getCurrentAsesorId:", error.message);
    return null;
  }
  return data as string | null;
}

/** Nombre de la asesora autenticada (lee su propia fila vía RLS asesores_asesor_select). */
export async function getMyNombre(): Promise<string | null> {
  const id = await getCurrentAsesorId();
  if (!id) return null;
  const { data, error } = await (supabase as any)
    .from("asesores")
    .select("nombre")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("getMyNombre:", error.message);
    return null;
  }
  return (data?.nombre as string) ?? null;
}

/**
 * Updates advisor presence.
 * @param disponible - true = available, false = unavailable. Omit to just refresh heartbeat.
 */
export async function updatePresence(
  disponible?: boolean,
  softphoneOk?: boolean | null,
  notifOk?: boolean | null,
): Promise<void> {
  const { error } = await (supabase as any).rpc("update_presence", {
    p_disponible: disponible ?? null,
    p_softphone_ok: softphoneOk ?? null,
    p_notif_ok: notifOk ?? null,
  });
  if (error) throw new Error(error.message);
}

// ── Own leads (call_queue joined to leads) ────────────────────────────────────

export interface MyLead {
  id: string;
  lead_id: string;
  estado: string;
  scheduled_at: string | null;
  ultimo_resultado: string | null;
  client_attempts: number;
  lead: {
    id: string;
    nombre: string;
    telefono: string;
    interes: string | null;
    city: string | null;
  } | null;
}

export async function getMyLeads(): Promise<MyLead[]> {
  const { data, error } = await (supabase as any)
    .from("call_queue")
    .select(`
      id,
      lead_id,
      estado,
      scheduled_at,
      ultimo_resultado,
      client_attempts,
      lead:leads(id, nombre, telefono, interes, city)
    `)
    .order("scheduled_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as MyLead[]) ?? [];
}

// ── Own call history (call_attempts) ─────────────────────────────────────────

export interface MyCallAttempt {
  id: string;
  call_queue_id: string;
  lead_id: string;
  estado: string;
  tipo: string;
  inicio_at: string | null;
  fin_at: string | null;
  ring_time_sec: number | null;
  talk_time_sec: number | null;
  outcome: string | null;
  notas: string | null;
  recording_storage_path: string | null;
  lead: {
    nombre: string;
    telefono: string;
  } | null;
}

export async function getMyHistory(): Promise<MyCallAttempt[]> {
  const { data, error } = await (supabase as any)
    .from("call_attempts")
    .select(`
      id,
      call_queue_id,
      lead_id,
      estado,
      tipo,
      inicio_at,
      fin_at,
      ring_time_sec,
      talk_time_sec,
      outcome,
      notas,
      recording_storage_path,
      lead:leads(nombre, telefono)
    `)
    .order("inicio_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data as MyCallAttempt[]) ?? [];
}

// ── Recording playback (Slice 3) ─────────────────────────────────────────────

/**
 * Returns a time-limited signed URL for a recording owned by the current asesor.
 * The edge function validates ownership; non-owner → 403.
 */
export async function getMyRecordingUrl(attempt_id: string): Promise<string> {
  const { data, error } = await (supabase as any).functions.invoke("get-recording", {
    body: { attempt_id },
  });
  if (error) throw new Error(error.message ?? "Error invocando get-recording");
  const result = data as { ok: boolean; url?: string; error?: string };
  if (!result.ok) throw new Error(result.error ?? "get-recording devolvió error");
  return result.url!;
}

// ── Notes (via kommo-note edge fn) ───────────────────────────────────────────

export async function submitCallNote(
  call_attempt_id: string,
  text: string
): Promise<void> {
  const { data, error } = await (supabase as any).functions.invoke("kommo-note", {
    body: { call_attempt_id, text },
  });
  if (error) throw new Error(error.message ?? "Error invocando kommo-note");
  const result = data as { ok: boolean; error?: string };
  if (!result.ok) throw new Error(result.error ?? "kommo-note devolvió error");
}

// El asesor ACEPTA un lead entrante (tocó "Contestar"): avisa al motor para que
// deje de ofrecerlo a otros. El softphone ya está marcando al cliente en paralelo.
export async function acceptLead(attempt_id: string): Promise<void> {
  const { data, error } = await (supabase as any).functions.invoke("asesor-accept-lead", {
    body: { attempt_id },
  });
  if (error) throw new Error(error.message ?? "Error invocando asesor-accept-lead");
  const result = data as { ok: boolean; error?: string };
  if (!result.ok) throw new Error(result.error ?? "asesor-accept-lead devolvió error");
}

// ── Direct call + stage management ───────────────────────────────────────────

export interface KommoStage {
  id: number;
  name: string;
}

export async function callLead(lead_id: string): Promise<{ ok: boolean; status?: string }> {
  const { data, error } = await (supabase as any).functions.invoke("asesor-call-lead", {
    body: { lead_id },
  });
  if (error) throw new Error(error.message ?? "Error invocando asesor-call-lead");
  const result = data as { ok: boolean; status?: string; error?: string };
  if (!result.ok) throw new Error(result.error ?? "asesor-call-lead devolvió error");
  return result;
}

export async function updateLeadStage(lead_id: string, status_id: number): Promise<void> {
  const { data, error } = await (supabase as any).functions.invoke("asesor-update-stage", {
    body: { lead_id, status_id },
  });
  if (error) throw new Error(error.message ?? "Error invocando asesor-update-stage");
  const result = data as { ok: boolean; error?: string };
  if (!result.ok) throw new Error(result.error ?? "asesor-update-stage devolvió error");
}

// ── Cotización helpers ────────────────────────────────────────────────────────

export async function previewCotizacion(
  lead_id: string,
  monto?: number
): Promise<{ html: string; monto: number }> {
  const body: Record<string, unknown> = { lead_id };
  if (monto !== undefined) body.monto = monto;
  const { data, error } = await (supabase as any).functions.invoke("preview-cotizacion", { body });
  if (error) throw new Error(error.message ?? "Error invocando preview-cotizacion");
  const result = data as { ok: boolean; html?: string; monto?: number; genero?: string; edad?: number; error?: string };
  if (!result.ok) throw new Error(result.error ?? "preview-cotizacion devolvió error");
  return { html: result.html!, monto: result.monto! };
}

export async function sendCotizacion(
  lead_id: string,
  monto?: number
): Promise<{ monto: number; to: string }> {
  const body: Record<string, unknown> = { lead_id };
  if (monto !== undefined) body.monto = monto;
  const { data, error } = await (supabase as any).functions.invoke("send-cotizacion", { body });
  if (error) throw new Error(error.message ?? "Error invocando send-cotizacion");
  const result = data as { ok: boolean; monto?: number; to?: string; error?: string };
  if (!result.ok) throw new Error(result.error ?? "send-cotizacion devolvió error");
  return { monto: result.monto!, to: result.to! };
}

// El asesor corrige datos del lead (edad/género/ahorro) durante la llamada para
// cotizar con la data real. Devuelve los valores aplicados.
export async function updateLead(
  lead_id: string,
  fields: { edad?: number; genero?: string; ahorro_semanal?: number; email?: string },
): Promise<{ edad?: number; genero?: string; ahorro_semanal?: number }> {
  const { data, error } = await (supabase as any).functions.invoke("asesor-update-lead", {
    body: { lead_id, ...fields },
  });
  if (error) throw new Error(error.message ?? "Error invocando asesor-update-lead");
  const result = data as { ok: boolean; edad?: number; genero?: string; ahorro_semanal?: number; error?: string };
  if (!result.ok) throw new Error(result.error ?? "asesor-update-lead devolvió error");
  return { edad: result.edad, genero: result.genero, ahorro_semanal: result.ahorro_semanal };
}

export async function getKommoStages(): Promise<KommoStage[]> {
  const { data, error } = await (supabase as any).functions.invoke("kommo-stages", {
    body: {},
  });
  if (error) throw new Error(error.message ?? "Error invocando kommo-stages");
  const result = data as { ok: boolean; stages?: KommoStage[]; error?: string };
  if (!result.ok) throw new Error(result.error ?? "kommo-stages devolvió error");
  return result.stages ?? [];
}

// ── Seguimiento / disposición ─────────────────────────────────────────────────

export type Disposicion =
  | "no_contesto"
  | "interesado"
  | "llamar_despues"
  | "cotizacion_enviada"
  | "cita_agendada"
  | "no_interesado"
  | "ganado"
  | "numero_equivocado";

export async function setDisposicion(
  lead_id: string,
  disposicion: Disposicion,
  opts?: { nota?: string; programar_para?: string }
): Promise<{ seguimiento_id: string }> {
  const { data, error } = await (supabase as any).functions.invoke(
    "asesor-set-disposicion",
    { body: { lead_id, disposicion, nota: opts?.nota, programar_para: opts?.programar_para } }
  );
  if (error) throw new Error(error.message ?? "Error invocando asesor-set-disposicion");
  const result = data as { ok: boolean; seguimiento_id?: string; error?: string };
  if (!result.ok) throw new Error(result.error ?? "asesor-set-disposicion devolvió error");
  return { seguimiento_id: result.seguimiento_id! };
}

// ── Timeline / lead history ───────────────────────────────────────────────────

export interface LeadInfo {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  genero: string | null;
  edad: number | null;
  disposicion_actual: string | null;
  kommo_lead_id: string | null;
  kommo_subdominio: string | null;
}

export interface TimelineEntryBase {
  tipo: "llamada" | "disposicion" | "cotizacion";
  fecha: string;
  asesor: string | null;
}

export interface TimelineLlamada extends TimelineEntryBase {
  tipo: "llamada";
  outcome: string | null;
  ring_time_sec: number | null;
  talk_time_sec: number | null;
  recording: string | null;
  nota: string | null;
}

export interface TimelineDisposicion extends TimelineEntryBase {
  tipo: "disposicion";
  disposicion: string;
  nota: string | null;
  programado_para: string | null;
}

export interface TimelineCotizacion extends TimelineEntryBase {
  tipo: "cotizacion";
  monto: number | null;
}

export type TimelineEntry = TimelineLlamada | TimelineDisposicion | TimelineCotizacion;

export async function getLeadHistory(
  lead_id: string
): Promise<{ lead: LeadInfo; timeline: TimelineEntry[] }> {
  const { data, error } = await (supabase as any).functions.invoke("lead-history", {
    body: { lead_id },
  });
  if (error) throw new Error(error.message ?? "Error invocando lead-history");
  const result = data as { ok: boolean; lead?: LeadInfo; timeline?: TimelineEntry[]; error?: string };
  if (!result.ok) throw new Error(result.error ?? "lead-history devolvió error");
  return { lead: result.lead!, timeline: result.timeline ?? [] };
}

// ── Own open seguimientos (RLS-scoped) ───────────────────────────────────────

export interface MiSeguimiento {
  id: string;
  lead_id: string;
  asesor_id: string;
  disposicion: string;
  nota: string | null;
  programado_para: string | null;
  estado: "pendiente" | "avisado" | "hecho" | "vencido" | "cancelado";
  creado_en: string;
  completado_en: string | null;
  leads: { nombre: string; telefono: string | null } | null;
}

export async function getMisSeguimientos(): Promise<MiSeguimiento[]> {
  const { data, error } = await (supabase as any)
    .from("seguimientos")
    .select("*, leads(nombre, telefono)")
    .neq("estado", "hecho")
    .neq("estado", "cancelado")
    .order("programado_para", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as MiSeguimiento[]) ?? [];
}
