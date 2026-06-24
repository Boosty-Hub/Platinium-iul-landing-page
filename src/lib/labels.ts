// labels.ts — human-readable string mappings (no internal jargon shown to users)

export const OUTCOME_LABELS: Record<string, string> = {
  contactado:                  "Contactado",
  advisor_no_answer:           "Asesor no contestó",
  client_no_answer:            "Cliente no contestó",
  voicemail:                   "Buzón de voz",
  busy:                        "Ocupado",
  failed:                      "No se pudo",
  cancelled:                   "Cancelada",
};

export const ATTEMPT_ESTADO_LABELS: Record<string, string> = {
  initiated:        "Iniciada",
  advisor_answered: "Asesor contestó",
  client_answered:  "Cliente contestó",
  no_answer:        "Sin respuesta",
  voicemail:        "Buzón",
  busy:             "Ocupado",
  failed:           "No se pudo",
  completed:        "Completada",
};

export const TIPO_LABELS: Record<string, string> = {
  queue_ring: "Automática",
  direct:     "Manual",
};

export function humanUltimoResultado(raw: string | null | undefined): string {
  if (!raw) return "—";
  const map: Record<string, string> = {
    contactado:                   "Contactado",
    cliente_no_contesto_reintento:"Cliente no contestó · reintentando",
    no_contactado_max:            "No contestó (máx. intentos)",
    ningun_asesor_contesto:       "Reintentando asesores",
    continua_rotacion:            "En proceso",
    fuera_horario:                "Fuera de horario",
    sin_telefono:                 "Sin teléfono",
    sin_asesores:                 "Sin asesores disponibles",
  };
  if (map[raw]) return map[raw];
  if (raw.startsWith("error")) return "Error temporal";
  // capitalize and replace underscores
  return raw.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function fmtDuration(sec: number | null | undefined): string {
  if (sec == null) return "—";
  if (sec < 60) return `${sec} s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${m}:00`;
}

export function fmtRelative(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "ayer";
  if (diffD < 7) return `hace ${diffD} días`;
  return new Date(dateStr).toLocaleDateString("es", { day: "numeric", month: "short" });
}
