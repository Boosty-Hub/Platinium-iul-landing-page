// ════════════════════════════════════════════════════════════════════════════
// seguimiento.ts — lógica de negocio del sistema de recontactos.
//
// Exports:
//   DISPOSICIONES   — lista de claves y etiquetas válidas
//   setDisposicion  — guarda disposición, sincroniza Kommo, agenda recontacto
//   getLeadHistory  — historial cronológico unificado del lead
// ════════════════════════════════════════════════════════════════════════════

import { adminClient, getIntegracion, kommoAddNote } from "./integraciones.ts";
import { kommoUpdateLead, statusCallEnum } from "./call_engine.ts";
import type { KommoCfg } from "./integraciones.ts";

type Admin = ReturnType<typeof adminClient>;

// ── Catálogo de disposiciones ─────────────────────────────────────────────────
export const DISPOSICIONES = [
  { key: "no_contesto",        label: "No contestó",         emoji: "📵" },
  { key: "interesado",         label: "Contestó — interesado", emoji: "🟢" },
  { key: "llamar_despues",     label: "Llamar después",       emoji: "🕐" },
  { key: "cotizacion_enviada", label: "Cotización enviada",   emoji: "💸" },
  { key: "cita_agendada",      label: "Cita agendada",        emoji: "📅" },
  { key: "no_interesado",      label: "No interesado",        emoji: "❌" },
  { key: "ganado",             label: "Ganado",               emoji: "🏆" },
  { key: "numero_equivocado",  label: "Número equivocado",    emoji: "⚠️"  },
] as const;

export type DisposicionKey = typeof DISPOSICIONES[number]["key"];

const VALID_KEYS = new Set<string>(DISPOSICIONES.map((d) => d.key));

// Shape del mapeo disposición→Kommo guardado en app_integraciones.kommo.config.disposiciones
interface DisposicionMapping {
  stage_id: string;
  status_call_key: string;
  schedulable?: boolean;
  proxima_cita?: boolean;
}

// ── setDisposicion ─────────────────────────────────────────────────────────────
export async function setDisposicion(
  admin: Admin,
  params: {
    lead_id: string;
    asesor_id: string;
    disposicion: string;
    nota?: string | null;
    programar_para?: string | null; // ISO 8601 timestamp
  },
): Promise<{ ok: true; seguimiento_id: string } | { ok: false; error: string }> {
  const { lead_id, asesor_id, disposicion, nota, programar_para } = params;

  // 1) Validar disposición
  if (!VALID_KEYS.has(disposicion)) {
    return { ok: false, error: `Disposición inválida: ${disposicion}` };
  }

  // 2) Determinar estado del seguimiento
  const tienePrograma = !!programar_para;
  const estadoSeg = tienePrograma ? "pendiente" : "hecho";
  const completadoEn = tienePrograma ? null : new Date().toISOString();

  // 3) INSERT seguimientos
  const { data: seg, error: segErr } = await admin
    .from("seguimientos")
    .insert({
      lead_id,
      asesor_id,
      disposicion,
      nota: nota ?? null,
      programado_para: programar_para ?? null,
      estado: estadoSeg,
      completado_en: completadoEn,
    })
    .select("id")
    .single();

  if (segErr || !seg) {
    return { ok: false, error: `Error al guardar seguimiento: ${segErr?.message}` };
  }
  const seguimiento_id = seg.id as string;

  // 4) UPDATE leads.disposicion_actual
  await admin
    .from("leads")
    .update({ disposicion_actual: disposicion })
    .eq("id", lead_id);

  // 5) Finalizar/reprogramar call_queue según la disposición.
  //    El motor (modelo click-to-call) deja el lead en in_progress; acá se CIERRA o
  //    se REPROGRAMA. Sin esto quedaría atascado en in_progress y nunca se recllama.
  {
    const { data: qRow } = await admin
      .from("call_queue")
      .select("kommo_lead_id, client_attempts")
      .eq("lead_id", lead_id)
      .maybeSingle();
    const kommoLeadId0 = qRow?.kommo_lead_id ?? null;
    const plusMin = (m: number) => new Date(Date.now() + m * 60_000).toISOString();

    if (tienePrograma) {
      // Recontacto agendado por el asesor → fijado a él.
      await admin.from("call_queue").upsert(
        { lead_id, estado: "scheduled", scheduled_at: programar_para, solo_asesor_id: asesor_id, next_asesor_idx: 0, client_attempts: 0, kommo_lead_id: kommoLeadId0 },
        { onConflict: "lead_id" },
      );
    } else if (disposicion === "no_contesto") {
      // Cliente no contestó → reintento automático. El gate de horario del motor
      // empuja el reintento a mañana si está cerrado. Tras max intentos → no contactado.
      const horarioI = await getIntegracion(admin, "horario");
      const hcfg = (horarioI?.config ?? {}) as Record<string, unknown>;
      const maxAttempts = Number(hcfg.max_client_attempts) || 3;
      let delays = [5, 15, 30];
      try {
        const d = typeof hcfg.client_retry_delays_min === "string"
          ? JSON.parse(hcfg.client_retry_delays_min as string)
          : hcfg.client_retry_delays_min;
        if (Array.isArray(d) && d.length) delays = d.map(Number);
      } catch { /* usa el default */ }
      const attempts = (qRow?.client_attempts ?? 0) + 1;
      if (attempts < maxAttempts) {
        const delay = delays[Math.min(attempts - 1, delays.length - 1)] ?? 30;
        await admin.from("call_queue").upsert(
          { lead_id, estado: "scheduled", scheduled_at: plusMin(delay), solo_asesor_id: null, next_asesor_idx: 0, client_attempts: attempts, ultimo_resultado: "cliente_no_contesto_reintento", kommo_lead_id: kommoLeadId0 },
          { onConflict: "lead_id" },
        );
      } else {
        await admin.from("call_queue").update({ estado: "no_contactado", client_attempts: attempts, ultimo_resultado: "no_contactado_max" }).eq("lead_id", lead_id);
      }
    } else {
      // Disposición terminal → cerrar la cola (no se vuelve a marcar sola).
      const negativa = disposicion === "no_interesado" || disposicion === "numero_equivocado";
      await admin.from("call_queue").update({ estado: negativa ? "no_contactado" : "contactado", ultimo_resultado: disposicion }).eq("lead_id", lead_id);
    }
  }

  // 6) Kommo — best-effort (log + continue si falla)
  try {
    const kommoI = await getIntegracion(admin, "kommo");
    if (kommoI?.activo) {
      const cfg = kommoI.config as unknown as KommoCfg & {
        disposiciones?: string | Record<string, DisposicionMapping>;
        proxima_cita_field_id?: string;
      };

      // Leer kommo_lead_id del call_queue (puede haber cambiado tras el upsert)
      const { data: qRow2 } = await admin
        .from("call_queue")
        .select("kommo_lead_id")
        .eq("lead_id", lead_id)
        .maybeSingle();
      const kommoLeadId = qRow2?.kommo_lead_id as string | null;

      if (kommoLeadId) {
        // Parsear el mapeo de disposiciones
        let dispMap: Record<string, DisposicionMapping> = {};
        const raw = cfg.disposiciones;
        if (typeof raw === "string") {
          try { dispMap = JSON.parse(raw); } catch { /* ignore */ }
        } else if (raw && typeof raw === "object") {
          dispMap = raw as Record<string, DisposicionMapping>;
        }

        const mapping = dispMap[disposicion];
        if (mapping) {
          const statusCallEnumId = statusCallEnum(cfg, mapping.status_call_key);
          try {
            await kommoUpdateLead(cfg, kommoLeadId, {
              stageStatusId: mapping.stage_id,
              statusCallEnumId: statusCallEnumId ?? undefined,
            });
          } catch (e) {
            console.error("setDisposicion/kommoUpdateLead:", (e as Error).message);
          }

          // Próxima cita (Kommo date_time = unix timestamp en segundos)
          if ((mapping.proxima_cita || tienePrograma) && programar_para && cfg.proxima_cita_field_id) {
            const unixSec = Math.floor(new Date(programar_para).getTime() / 1000);
            try {
              const base = `https://${cfg.subdominio}.kommo.com/api/v4`;
              const res = await fetch(`${base}/leads/${kommoLeadId}`, {
                method: "PATCH",
                headers: {
                  Authorization: `Bearer ${cfg.access_token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  custom_fields_values: [
                    {
                      field_id: Number(cfg.proxima_cita_field_id),
                      values: [{ value: unixSec }],
                    },
                  ],
                }),
              });
              if (!res.ok) {
                const t = await res.text();
                console.error(`setDisposicion/proxima_cita Kommo ${res.status}: ${t.slice(0, 200)}`);
              }
            } catch (e) {
              console.error("setDisposicion/proxima_cita:", (e as Error).message);
            }
          }
        }

        // Nota → Kommo (best-effort)
        if (nota) {
          try {
            await kommoAddNote(cfg, kommoLeadId, `[${disposicion}] ${nota}`);
          } catch (e) {
            console.error("setDisposicion/kommoAddNote:", (e as Error).message);
          }
        }
      }
    }
  } catch (e) {
    console.error("setDisposicion/kommo block:", (e as Error).message);
  }

  return { ok: true, seguimiento_id };
}

// ── getLeadHistory ─────────────────────────────────────────────────────────────
interface TimelineEntry {
  tipo: "llamada" | "disposicion" | "cotizacion";
  fecha: string;
  [key: string]: unknown;
}

export async function getLeadHistory(
  admin: Admin,
  lead_id: string,
): Promise<{
  lead: Record<string, unknown>;
  timeline: TimelineEntry[];
} | { error: string }> {
  // 1) Lead data
  const { data: lead, error: leadErr } = await admin
    .from("leads")
    .select("id, nombre, telefono, email, genero, anio_nacimiento, ahorro_semanal, cotizacion_enviada_at, cotizacion_monto, disposicion_actual")
    .eq("id", lead_id)
    .maybeSingle();

  if (leadErr || !lead) {
    return { error: "Lead no encontrado" };
  }

  const edad = lead.anio_nacimiento
    ? new Date().getFullYear() - Number(lead.anio_nacimiento)
    : null;

  // 2) call_attempts con nombre de asesor
  const { data: attempts } = await admin
    .from("call_attempts")
    .select("id, inicio_at, fin_at, asesor_id, outcome, ring_time_sec, talk_time_sec, recording_storage_path, notas, asesores(nombre)")
    .eq("lead_id", lead_id)
    .order("inicio_at", { ascending: false });

  // 3) seguimientos con nombre de asesor
  const { data: segs } = await admin
    .from("seguimientos")
    .select("id, creado_en, disposicion, nota, programado_para, estado, asesor_id, asesores(nombre)")
    .eq("lead_id", lead_id)
    .order("creado_en", { ascending: false });

  // 4) Construir timeline
  const timeline: TimelineEntry[] = [];

  for (const a of attempts ?? []) {
    if (!a.inicio_at) continue;
    timeline.push({
      tipo: "llamada",
      fecha: a.inicio_at,
      asesor: (a.asesores as { nombre?: string } | null)?.nombre ?? null,
      outcome: a.outcome,
      ring_time_sec: a.ring_time_sec,
      talk_time_sec: a.talk_time_sec,
      recording_path: a.recording_storage_path,
      nota: a.notas,
    });
  }

  for (const s of segs ?? []) {
    timeline.push({
      tipo: "disposicion",
      fecha: s.creado_en,
      disposicion: s.disposicion,
      nota: s.nota,
      programado_para: s.programado_para,
      estado: s.estado,
      asesor: (s.asesores as { nombre?: string } | null)?.nombre ?? null,
    });
  }

  if (lead.cotizacion_enviada_at) {
    timeline.push({
      tipo: "cotizacion",
      fecha: lead.cotizacion_enviada_at,
      monto: lead.cotizacion_monto,
    });
  }

  // Ordenar desc por fecha
  timeline.sort((a, b) => {
    const ta = new Date(a.fecha as string).getTime();
    const tb = new Date(b.fecha as string).getTime();
    return tb - ta;
  });

  return {
    lead: {
      id: lead.id,
      nombre: lead.nombre,
      telefono: lead.telefono,
      email: lead.email,
      genero: lead.genero,
      edad,
      disposicion_actual: lead.disposicion_actual,
    },
    timeline,
  };
}
