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

/**
 * Updates advisor presence.
 * @param disponible - true = available, false = unavailable. Omit to just refresh heartbeat.
 */
export async function updatePresence(disponible?: boolean): Promise<void> {
  const { error } = await (supabase as any).rpc("update_presence", {
    p_disponible: disponible ?? null,
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
