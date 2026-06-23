import { supabase } from "@/integrations/supabase/client";

export interface Integracion {
  clave: string;
  nombre: string;
  activo: boolean;
  config: Record<string, string>;
  secretos: Record<string, boolean>;
  actualizado_en: string;
}

// Kommo metadata types
export interface KommoPipelineStatus {
  id: number;
  name: string;
}

export interface KommoPipeline {
  id: number;
  name: string;
  statuses: KommoPipelineStatus[];
}

export interface KommoUser {
  id: number;
  name: string;
  email: string;
}

export interface KommoEnum {
  id: number;
  value: string;
}

export interface KommoField {
  id: number;
  name: string;
  type: string;
  enums?: KommoEnum[];
}

export interface KommoMetadata {
  ok: boolean;
  pipelines: KommoPipeline[];
  users: KommoUser[];
  leadFields: KommoField[];
  contactFields: KommoField[];
}

// Asesor type
export interface Asesor {
  id: string;
  nombre: string;
  rc_extension: string | null;
  telefono: string | null;
  kommo_user_id: string | null;
  /** enum_id del campo SELECT "Responsable" de Kommo (asignación por nombre) */
  kommo_responsable_enum_id: string | null;
  activo: boolean;
  orden: number;
}

// Horario type
export interface HorarioDia {
  abre: string;
  cierra: string;
  activo: boolean;
}

export interface Horario {
  timezone: string;
  schedule: Record<string, HorarioDia>;
  client_retry_delays_min: number[];
  max_client_attempts: number;
  advisor_ring_timeout_sec: number;
}

export async function getIntegraciones(): Promise<Integracion[]> {
  const { data, error } = await (supabase as any).rpc("admin_get_integraciones");
  if (error) throw error;
  return (data as Integracion[]) ?? [];
}

export async function upsertIntegracion(
  clave: string,
  nombre: string,
  config: Record<string, string>,
  activo: boolean
): Promise<{ ok: boolean; clave: string }> {
  const { data, error } = await (supabase as any).rpc("admin_upsert_integracion", {
    p_clave: clave,
    p_nombre: nombre,
    p_config: config,
    p_activo: activo,
  });
  if (error) throw error;
  return data as { ok: boolean; clave: string };
}

export async function testIntegracion(
  clave: string
): Promise<{ ok: boolean; mensaje?: string; error?: string }> {
  const { data, error } = await (supabase as any).functions.invoke("test-integracion", {
    body: { clave },
  });
  if (error) return { ok: false, error: error.message ?? "No autorizado o error de red" };
  return data as { ok: boolean; mensaje?: string; error?: string };
}

// Kommo metadata
export async function getKommoMetadata(): Promise<KommoMetadata> {
  const { data, error } = await (supabase as any).functions.invoke("kommo-metadata", {
    body: {},
  });
  if (error) throw new Error(error.message ?? "Error invocando kommo-metadata");
  const result = data as KommoMetadata;
  if (!result.ok) throw new Error((result as any).error ?? "kommo-metadata devolvió error");
  return result;
}

// Asesores CRUD
export async function listAsesores(): Promise<Asesor[]> {
  const { data, error } = await (supabase as any)
    .from("asesores")
    .select("*")
    .order("orden");
  if (error) throw error;
  return (data as Asesor[]) ?? [];
}

export async function upsertAsesor(
  a: Omit<Asesor, "id"> & { id?: string }
): Promise<Asesor> {
  if (a.id) {
    const { id, ...rest } = a;
    const { data, error } = await (supabase as any)
      .from("asesores")
      .update(rest)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Asesor;
  } else {
    const { id: _id, ...rest } = a as any;
    const { data, error } = await (supabase as any)
      .from("asesores")
      .insert(rest)
      .select()
      .single();
    if (error) throw error;
    return data as Asesor;
  }
}

export async function deleteAsesor(id: string): Promise<void> {
  const { error } = await (supabase as any).from("asesores").delete().eq("id", id);
  if (error) throw error;
}

// Horario helpers
const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"] as const;

const DEFAULT_HORARIO: Horario = {
  timezone: "America/New_York",
  schedule: Object.fromEntries(
    DIAS.map((d) => [
      d,
      { abre: "09:00", cierra: "18:00", activo: !["sabado", "domingo"].includes(d) },
    ])
  ),
  client_retry_delays_min: [5, 15, 30],
  max_client_attempts: 3,
  advisor_ring_timeout_sec: 30,
};

export async function getHorario(): Promise<Horario> {
  const integraciones = await getIntegraciones();
  const horario = integraciones.find((i) => i.clave === "horario");
  if (!horario) return DEFAULT_HORARIO;
  try {
    const cfg = horario.config;
    return {
      timezone: cfg.timezone ?? DEFAULT_HORARIO.timezone,
      schedule: cfg.schedule ? JSON.parse(cfg.schedule) : DEFAULT_HORARIO.schedule,
      client_retry_delays_min: cfg.client_retry_delays_min
        ? JSON.parse(cfg.client_retry_delays_min)
        : DEFAULT_HORARIO.client_retry_delays_min,
      max_client_attempts: cfg.max_client_attempts
        ? parseInt(cfg.max_client_attempts, 10)
        : DEFAULT_HORARIO.max_client_attempts,
      advisor_ring_timeout_sec: cfg.advisor_ring_timeout_sec
        ? parseInt(cfg.advisor_ring_timeout_sec, 10)
        : DEFAULT_HORARIO.advisor_ring_timeout_sec,
    };
  } catch {
    return DEFAULT_HORARIO;
  }
}

export async function saveHorario(cfg: Horario): Promise<void> {
  await upsertIntegracion(
    "horario",
    "Horario y reintentos",
    {
      timezone: cfg.timezone,
      schedule: JSON.stringify(cfg.schedule),
      client_retry_delays_min: JSON.stringify(cfg.client_retry_delays_min),
      max_client_attempts: String(cfg.max_client_attempts),
      advisor_ring_timeout_sec: String(cfg.advisor_ring_timeout_sec),
    },
    true
  );
}
