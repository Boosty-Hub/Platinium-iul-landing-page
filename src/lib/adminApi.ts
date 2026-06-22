import { supabase } from "@/integrations/supabase/client";

export interface Integracion {
  clave: string;
  nombre: string;
  activo: boolean;
  config: Record<string, string>;
  secretos: Record<string, boolean>;
  actualizado_en: string;
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
