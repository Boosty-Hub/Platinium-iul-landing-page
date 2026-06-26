import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PhoneCall, RefreshCw, ChevronDown, ChevronRight, Mic, PhoneIncoming, PhoneOutgoing, Check, Search, Receipt, X } from "lucide-react";
import { listAsesores, getRecordingUrl, getCotizacionPreview } from "@/lib/adminApi";
import { humanUltimoResultado, TIPO_LABELS, fmtDuration } from "@/lib/labels";

// ─── Types ────────────────────────────────────────────────────────────────────

type QueueEstado =
  | "pending"
  | "scheduled"
  | "in_progress"
  | "contactado"
  | "no_contactado"
  | "failed"
  | "cancelled";

type AttemptEstado =
  | "initiated"
  | "advisor_answered"
  | "client_answered"
  | "no_answer"
  | "voicemail"
  | "busy"
  | "failed"
  | "completed";

interface LeadInfo {
  nombre: string | null;
  telefono: string | null;
  email: string | null;
  created_at: string | null;
  cotizacion_enviada_at: string | null;
  cotizacion_monto: number | null;
}

interface CallQueue {
  id: string;
  lead_id: string | null;
  estado: QueueEstado;
  scheduled_at: string | null;
  client_attempts: number | null;
  asesor_id: string | null;
  kommo_lead_id: string | null;
  ultimo_resultado: string | null;
  created_at: string;
  updated_at: string;
  leads: LeadInfo | null;
}

interface CallAttempt {
  id: string;
  asesor_id: string | null;
  tipo: string | null;
  estado: AttemptEstado;
  outcome: string | null;
  inicio_at: string | null;
  ring_time_sec: number | null;
  talk_time_sec: number | null;
  duracion_seg: number | null;
  recording_url: string | null;
  recording_storage_path: string | null;
  notas: string | null;
  created_at: string;
  rc_result: string | null;        // resultado REAL en RingCentral
}

// Traduce el resultado crudo de RingCentral a algo legible.
function rcLabel(result: string | null): string | null {
  if (!result) return null;
  const m: Record<string, string> = {
    "Call connected": "Conectó",
    "Voicemail": "Buzón de voz",
    "No Answer": "No contestó",
    "Busy": "Ocupado",
    "Hang Up": "Colgó",
    "Rejected": "Rechazada",
  };
  return m[result] ?? result;
}

// ─── Badge helpers ─────────────────────────────────────────────────────────────

const QUEUE_BADGE: Record<QueueEstado, { label: string; cls: string }> = {
  pending:       { label: "Pendiente",      cls: "bg-[#6A8E98]/15 text-[#6A8E98] border-[#6A8E98]/25" },
  scheduled:     { label: "Programada",     cls: "bg-blue-500/15 text-blue-400 border-blue-500/25" },
  in_progress:   { label: "En curso",       cls: "bg-[#1d9fa9]/15 text-[#1d9fa9] border-[#1d9fa9]/25" },
  contactado:    { label: "Contactado",     cls: "bg-green-500/15 text-green-400 border-green-500/25" },
  no_contactado: { label: "No contactado",  cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25" },
  failed:        { label: "Fallida",        cls: "bg-red-500/15 text-red-400 border-red-500/25" },
  cancelled:     { label: "Cancelada",      cls: "bg-[#6A8E98]/15 text-[#6A8E98] border-[#6A8E98]/25" },
};

// Buckets de estado para los chips del filtro (agrupan estados afines).
const ESTADO_BUCKETS: { key: string; label: string; estados: QueueEstado[]; cls: string }[] = [
  { key: "cola",          label: "En cola",        estados: ["scheduled", "pending"], cls: "text-blue-400 border-blue-500/50 bg-blue-500/15" },
  { key: "curso",         label: "En curso",       estados: ["in_progress"],          cls: "text-[#1d9fa9] border-[#1d9fa9]/50 bg-[#1d9fa9]/15" },
  { key: "contactado",    label: "Contactados",    estados: ["contactado"],           cls: "text-green-400 border-green-500/50 bg-green-500/15" },
  { key: "no_contactado", label: "No contactados", estados: ["no_contactado", "failed"], cls: "text-yellow-400 border-yellow-500/50 bg-yellow-500/15" },
  { key: "cancelado",     label: "Cancelados",     estados: ["cancelled"],            cls: "text-[#6A8E98] border-[#6A8E98]/50 bg-[#6A8E98]/15" },
];

const ATTEMPT_BADGE: Record<AttemptEstado, { label: string; cls: string }> = {
  initiated:        { label: "Iniciada",         cls: "bg-blue-500/15 text-blue-400 border-blue-500/25" },
  advisor_answered: { label: "Asesor contestó",  cls: "bg-[#1d9fa9]/15 text-[#1d9fa9] border-[#1d9fa9]/25" },
  client_answered:  { label: "Cliente contestó", cls: "bg-green-500/15 text-green-400 border-green-500/25" },
  no_answer:        { label: "Sin respuesta",    cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25" },
  voicemail:        { label: "Buzón de voz",     cls: "bg-[#94B3BB]/15 text-[#94B3BB] border-[#94B3BB]/25" },
  busy:             { label: "Ocupado",          cls: "bg-orange-500/15 text-orange-400 border-orange-500/25" },
  failed:           { label: "Fallida",          cls: "bg-red-500/15 text-red-400 border-red-500/25" },
  completed:        { label: "Completada",       cls: "bg-green-500/15 text-green-400 border-green-500/25" },
};

function QueueBadge({ estado }: { estado: QueueEstado }) {
  const b = QUEUE_BADGE[estado] ?? { label: estado, cls: "bg-[#6A8E98]/15 text-[#6A8E98] border-[#6A8E98]/25" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${b.cls}`}>
      {b.label}
    </span>
  );
}

function EstadoChip({ active, onClick, label, count, cls }: {
  active: boolean; onClick: () => void; label: string; count: number; cls: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5 ${
        active ? cls : "border-[#1d9fa9]/15 text-[#94B3BB] hover:text-white hover:border-[#1d9fa9]/40"
      }`}
    >
      {label}
      <span className={`px-1.5 rounded-full text-[10px] ${active ? "bg-black/25" : "bg-[#1d9fa9]/10"}`}>{count}</span>
    </button>
  );
}

// Modal que muestra la cotización del lead (la genera preview-cotizacion).
function CotizacionModal({ leadId, nombre, onClose }: { leadId: string; nombre: string; onClose: () => void }) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    getCotizacionPreview(leadId)
      .then((r) => setHtml(r.html))
      .catch((e) => setErr((e as Error).message))
      .finally(() => setLoading(false));
  }, [leadId]);
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative w-full max-w-2xl max-h-[88vh] bg-white rounded-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1d9fa9]/20 bg-[#0F2229]">
          <div className="flex items-center gap-2 text-[#E4EEF0]">
            <Receipt className="w-4 h-4 text-[#1d9fa9]" />
            <span className="font-semibold text-sm">Cotización — {nombre}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#94B3BB] hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {loading ? (
          <div className="p-12 text-center text-[#6A8E98]">Cargando cotización…</div>
        ) : err ? (
          <div className="p-12 text-center text-red-500 text-sm">No se pudo cargar la cotización: {err}</div>
        ) : (
          <iframe title="Cotización" srcDoc={html ?? ""} className="w-full h-[72vh] border-0 bg-white" />
        )}
      </div>
    </div>
  );
}

function AttemptBadge({ estado }: { estado: AttemptEstado }) {
  const b = ATTEMPT_BADGE[estado] ?? { label: estado, cls: "bg-[#6A8E98]/15 text-[#6A8E98] border-[#6A8E98]/25" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${b.cls}`}>
      {b.label}
    </span>
  );
}

// ─── Attempt list ──────────────────────────────────────────────────────────────

// Resultado humano y claro de cada intento (qué pasó exactamente).
function attemptResult(a: CallAttempt): { label: string; cls: string } {
  switch (a.outcome) {
    case "contactado": return { label: "Contactado", cls: "text-emerald-400" };
    case "advisor_no_answer": return { label: "El asesor no contestó", cls: "text-yellow-400" };
    case "client_no_answer": return { label: "Atendió el asesor — el cliente no contestó", cls: "text-orange-400" };
    case "voicemail": return { label: "Buzón de voz del cliente", cls: "text-[#94B3BB]" };
    case "failed": return { label: "Falló la llamada", cls: "text-red-400" };
    case "cancelled": return { label: "Cancelada", cls: "text-[#6A8E98]" };
  }
  switch (a.estado) {
    case "completed":
    case "client_answered": return { label: "Contactado", cls: "text-emerald-400" };
    case "advisor_answered": return { label: "Asesor contestó", cls: "text-[#1d9fa9]" };
    case "no_answer": return { label: "El asesor no contestó", cls: "text-yellow-400" };
    case "voicemail": return { label: "Buzón de voz", cls: "text-[#94B3BB]" };
    case "busy": return { label: "Ocupado", cls: "text-orange-400" };
    case "failed": return { label: "Falló", cls: "text-red-400" };
    case "initiated": return { label: "Llamando…", cls: "text-blue-400" };
  }
  return { label: a.notas ?? "—", cls: "text-[#94B3BB]" };
}

// ¿El asesor atendió ese intento?
function asesorAtendio(a: CallAttempt): boolean {
  return a.outcome === "contactado" || a.outcome === "client_no_answer" || a.outcome === "voicemail" ||
    a.estado === "advisor_answered" || a.estado === "client_answered" || a.estado === "completed";
}

// Dirección: entrante = el sistema le marca al asesor (automática); saliente = el asesor llama.
function tipoInfo(tipo: string | null): { label: string; entrante: boolean } {
  return tipo === "direct" ? { label: "Saliente", entrante: false } : { label: "Entrante", entrante: true };
}

const mmss = (s: number | null) => (s == null ? "—" : fmtDuration(s));

// Reproductor de grabación bajo demanda (firma la URL al tocar "Escuchar").
function RecordingCell({ attemptId, hasRecording }: { attemptId: string; hasRecording: boolean }) {
  const [url, setUrl] = useState<string | null>(null);
  const [rloading, setRloading] = useState(false);
  if (!hasRecording) return <span className="text-[#6A8E98]">—</span>;
  if (url) {
    // eslint-disable-next-line jsx-a11y/media-has-caption
    return <audio controls src={url} className="h-6 w-36 min-w-0" preload="none" />;
  }
  return (
    <button
      onClick={async () => {
        setRloading(true);
        try { setUrl(await getRecordingUrl(attemptId)); } catch { /* ignore */ } finally { setRloading(false); }
      }}
      className="inline-flex items-center gap-1 text-[#1d9fa9] hover:underline"
    >
      <Mic className="w-3 h-3" /> {rloading ? "Cargando…" : "Escuchar"}
    </button>
  );
}

function AttemptsPanel({ leadId, asesores }: { leadId: string; asesores: Record<string, string> }) {
  const [attempts, setAttempts] = useState<CallAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (supabase as any)
      .from("call_attempts")
      .select("id,asesor_id,tipo,estado,outcome,inicio_at,ring_time_sec,talk_time_sec,duracion_seg,recording_url,recording_storage_path,notas,created_at,rc_result")
      .eq("lead_id", leadId)
      .order("inicio_at", { ascending: true })
      .then(({ data, error }: { data: CallAttempt[] | null; error: Error | null }) => {
        if (cancelled) return;
        if (!error && data) setAttempts(data);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [leadId]);

  if (loading) {
    return <div className="px-6 py-4 text-[#6A8E98] text-sm animate-pulse">Cargando trazabilidad…</div>;
  }
  if (attempts.length === 0) {
    return <div className="px-6 py-4 text-[#6A8E98] text-sm">Todavía no se marcó a este lead.</div>;
  }

  // ── Resumen de trazabilidad del lead ──
  const dialCounts = new Map<string, number>();
  let answeredBy: string | null = null;
  let contactado = false;
  let talkSec = 0;
  for (const a of attempts) {
    if (a.asesor_id) dialCounts.set(a.asesor_id, (dialCounts.get(a.asesor_id) ?? 0) + 1);
    if (asesorAtendio(a)) answeredBy = a.asesor_id ? (asesores[a.asesor_id] ?? "un asesor") : "un asesor";
    if (a.outcome === "contactado") { contactado = true; talkSec += a.talk_time_sec ?? 0; }
  }
  const dialSummary = [...dialCounts.entries()].map(([id, n]) => `${asesores[id] ?? "—"} ×${n}`).join("  ·  ");

  return (
    <div className="px-4 pb-4 pt-2">
      {/* Resumen: a quién sonó, cuántas veces, quién atendió */}
      <div className="mb-3 rounded-lg border border-[#1d9fa9]/15 bg-[#0B1A1E]/50 px-4 py-3 text-xs flex flex-wrap items-center gap-x-5 gap-y-1.5">
        <span className="text-[#94B3BB]"><b className="text-[#E4EEF0]">{attempts.length}</b> marcación(es)</span>
        {dialSummary && (
          <span className="text-[#94B3BB]">Sonó a: <span className="text-[#E4EEF0]">{dialSummary}</span></span>
        )}
        {answeredBy ? (
          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
            <Check className="w-3.5 h-3.5" /> Atendió {answeredBy}
            {contactado ? ` · habló ${fmtDuration(talkSec)}` : " (el cliente no contestó)"}
          </span>
        ) : (
          <span className="text-yellow-400/80">Ningún asesor atendió todavía</span>
        )}
      </div>

      <div className="rounded-lg border border-[#1d9fa9]/10 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1d9fa9]/10 bg-[#0B1A1E]/60">
              <th className="text-left px-3 py-2 text-[#6A8E98] font-medium">Fecha</th>
              <th className="text-left px-3 py-2 text-[#6A8E98] font-medium">Tipo</th>
              <th className="text-left px-3 py-2 text-[#6A8E98] font-medium">Asesor</th>
              <th className="text-left px-3 py-2 text-[#6A8E98] font-medium">Resultado</th>
              <th className="text-left px-3 py-2 text-[#6A8E98] font-medium">Timbró</th>
              <th className="text-left px-3 py-2 text-[#6A8E98] font-medium">Conversación</th>
              <th className="text-left px-3 py-2 text-[#6A8E98] font-medium">Grabación</th>
              <th className="text-left px-3 py-2 text-[#6A8E98] font-medium">Nota</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((a, idx) => {
              const r = attemptResult(a);
              const t = tipoInfo(a.tipo);
              return (
                <tr
                  key={a.id}
                  className={`border-b border-[#1d9fa9]/10 last:border-0 ${idx % 2 === 0 ? "" : "bg-[#0B1A1E]/20"}`}
                >
                  <td className="px-3 py-2.5 text-[#94B3BB] whitespace-nowrap">
                    {new Date(a.inicio_at ?? a.created_at).toLocaleString("es-US", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1 text-[#94B3BB]" title={t.entrante ? "Marcada por el sistema" : "Marcada por el asesor"}>
                      {t.entrante ? <PhoneIncoming className="w-3 h-3 text-[#1d9fa9]" /> : <PhoneOutgoing className="w-3 h-3 text-blue-400" />}
                      {t.label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[#E4EEF0] whitespace-nowrap">{a.asesor_id ? (asesores[a.asesor_id] ?? "—") : "—"}</td>
                  <td className={`px-3 py-2.5 font-medium ${r.cls}`}>
                    <div>{r.label}</div>
                    {a.rc_result && (
                      <div
                        className={`mt-0.5 inline-flex items-center gap-1 text-[10px] font-normal ${a.rc_result === "Call connected" ? "text-emerald-400/90" : "text-[#6A8E98]"}`}
                        title="Resultado real en RingCentral"
                      >
                        <PhoneCall className="w-2.5 h-2.5" /> RC: {rcLabel(a.rc_result)}{(a.duracion_seg ?? 0) > 0 ? ` · ${fmtDuration(a.duracion_seg!)}` : ""}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-[#94B3BB] whitespace-nowrap">{mmss(a.ring_time_sec)}</td>
                  <td className="px-3 py-2.5 text-[#94B3BB] whitespace-nowrap">{mmss(a.talk_time_sec || a.duracion_seg)}</td>
                  <td className="px-3 py-2.5">
                    <RecordingCell attemptId={a.id} hasRecording={!!a.recording_storage_path || !!a.recording_url} />
                  </td>
                  <td className="px-3 py-2.5 text-[#94B3BB] max-w-[160px] truncate">{a.notas ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LlamadasPage() {
  const [queue, setQueue] = useState<CallQueue[]>([]);
  const [asesores, setAsesores] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState<"todo" | "hoy" | "7d" | "30d">("todo");
  const [estadoFilter, setEstadoFilter] = useState<string>("todos");
  const [cotizacionLead, setCotizacionLead] = useState<{ id: string; nombre: string } | null>(null);

  // Conteo por estado (para los chips).
  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: queue.length };
    for (const b of ESTADO_BUCKETS) c[b.key] = queue.filter((i) => b.estados.includes(i.estado)).length;
    return c;
  }, [queue]);

  // Filtro por estado + nombre/teléfono + rango de fecha (sobre la última actualización).
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let cutoff = 0;
    const now = Date.now();
    if (timeFilter === "hoy") {
      const d = new Date(); d.setHours(0, 0, 0, 0); cutoff = d.getTime();
    } else if (timeFilter === "7d") cutoff = now - 7 * 86400_000;
    else if (timeFilter === "30d") cutoff = now - 30 * 86400_000;
    const bucket = ESTADO_BUCKETS.find((b) => b.key === estadoFilter);
    return queue.filter((item) => {
      if (bucket && !bucket.estados.includes(item.estado)) return false;
      if (cutoff && new Date(item.updated_at).getTime() < cutoff) return false;
      if (q) {
        const nombre = (item.leads?.nombre ?? "").toLowerCase();
        const tel = (item.leads?.telefono ?? "").toLowerCase();
        if (!nombre.includes(q) && !tel.includes(q)) return false;
      }
      return true;
    });
  }, [queue, search, timeFilter, estadoFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data, error: err }, asesoresList] = await Promise.all([
        (supabase as any)
          .from("call_queue")
          .select("*, leads(nombre,telefono,email,created_at,cotizacion_enviada_at,cotizacion_monto)")
          .order("updated_at", { ascending: false })
          .limit(200),
        listAsesores().catch(() => []),
      ]);
      if (err) throw err;
      setQueue((data as CallQueue[]) ?? []);
      setAsesores(Object.fromEntries(asesoresList.map((a) => [a.id, a.nombre])));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cargando llamadas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const fmt = (ts: string) =>
    new Date(ts).toLocaleString("es-US", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#E4EEF0]">Llamadas</h2>
          <p className="text-sm text-[#94B3BB] mt-1">
            Cola de llamadas y registro de intentos.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-[#1d9fa9]/25 text-[#94B3BB] hover:text-white hover:border-[#1d9fa9]/60 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Recargar
        </button>
      </div>

      {/* Filtros: estado + búsqueda + fecha */}
      {!loading && !error && queue.length > 0 && (
        <div className="space-y-3 mb-4">
          {/* Chips de estado */}
          <div className="flex flex-wrap gap-2">
            <EstadoChip
              active={estadoFilter === "todos"}
              onClick={() => setEstadoFilter("todos")}
              label="Todos"
              count={counts.todos}
              cls="text-[#E4EEF0] border-[#1d9fa9]/60 bg-[#1d9fa9]/20"
            />
            {ESTADO_BUCKETS.map((b) => (
              <EstadoChip
                key={b.key}
                active={estadoFilter === b.key}
                onClick={() => setEstadoFilter(b.key)}
                label={b.label}
                count={counts[b.key]}
                cls={b.cls}
              />
            ))}
          </div>
          {/* Búsqueda + fecha */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6A8E98]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o teléfono…"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0B1A1E] border border-[#1d9fa9]/25 text-sm text-[#E4EEF0] placeholder-[#6A8E98] focus:outline-none focus:border-[#1d9fa9]/60 transition-colors"
              />
            </div>
            <div className="flex gap-1.5">
              {([["todo", "Todo"], ["hoy", "Hoy"], ["7d", "7 días"], ["30d", "30 días"]] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setTimeFilter(val)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    timeFilter === val
                      ? "bg-[#1d9fa9]/20 border-[#1d9fa9]/50 text-[#1d9fa9]"
                      : "border-[#1d9fa9]/20 text-[#94B3BB] hover:text-white hover:border-[#1d9fa9]/50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-[#0F2229] border border-[#1d9fa9]/10 animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && queue.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-xl border border-[#1d9fa9]/15 bg-[#0F2229]">
          <PhoneCall className="w-12 h-12 text-[#1d9fa9]/40" />
          <div className="text-center">
            <p className="text-[#E4EEF0] font-medium">Aún no hay llamadas registradas</p>
            <p className="text-sm text-[#6A8E98] mt-1">
              Las llamadas aparecerán acá automáticamente cuando llegue un lead en horario laboral.
            </p>
          </div>
        </div>
      )}

      {/* Table — desktop */}
      {!loading && !error && queue.length > 0 && (
        <>
          {filtered.length === 0 && (
            <div className="rounded-xl border border-[#1d9fa9]/15 bg-[#0F2229] py-12 text-center text-[#6A8E98] text-sm">
              No hay llamadas que coincidan con la búsqueda o el filtro de fecha.
            </div>
          )}
          {/* Desktop */}
          <div className="hidden md:block rounded-xl border border-[#1d9fa9]/20 bg-[#0F2229] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1d9fa9]/15 bg-[#0B1A1E]/60">
                  <th className="w-8 px-3 py-3" />
                  <th className="text-left px-4 py-3 text-[#6A8E98] font-medium">Lead</th>
                  <th className="text-left px-4 py-3 text-[#6A8E98] font-medium">Estado</th>
                  <th className="text-left px-4 py-3 text-[#6A8E98] font-medium">Intentos</th>
                  <th className="text-left px-4 py-3 text-[#6A8E98] font-medium">Asesor</th>
                  <th className="text-left px-4 py-3 text-[#6A8E98] font-medium">Última actualización</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => {
                  const isOpen = expanded.has(item.id);
                  const lead = item.leads;
                  return (
                    <>
                      <tr
                        key={item.id}
                        onClick={() => toggleExpand(item.id)}
                        className={`border-b border-[#1d9fa9]/10 cursor-pointer transition-colors hover:bg-[#1d9fa9]/5 ${
                          isOpen ? "bg-[#1d9fa9]/5" : idx % 2 === 0 ? "" : "bg-[#0B1A1E]/20"
                        }`}
                      >
                        <td className="px-3 py-3 text-[#6A8E98]">
                          {isOpen ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-[#E4EEF0]">
                            {lead?.nombre ?? <span className="text-[#6A8E98]">—</span>}
                          </div>
                          {lead?.telefono && (
                            <div className="text-xs text-[#6A8E98] font-mono mt-0.5">{lead.telefono}</div>
                          )}
                          {lead?.cotizacion_enviada_at && item.lead_id && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setCotizacionLead({ id: item.lead_id!, nombre: lead.nombre ?? "este lead" }); }}
                              className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
                              title="Ver la cotización enviada"
                            >
                              <Receipt className="w-3 h-3" />
                              Cotización{lead.cotizacion_monto ? ` $${Number(lead.cotizacion_monto).toLocaleString()}` : ""} · Ver
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <QueueBadge estado={item.estado} />
                          {item.ultimo_resultado && (
                            <div className="text-xs text-[#6A8E98] mt-1 max-w-[180px] truncate">
                              {humanUltimoResultado(item.ultimo_resultado)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#94B3BB]">
                          {item.client_attempts ?? 0}
                        </td>
                        <td className="px-4 py-3 text-[#94B3BB] text-sm">
                          {item.asesor_id ? (
                            asesores[item.asesor_id] ?? <span className="text-[#6A8E98] text-xs">—</span>
                          ) : (
                            <span className="text-[#6A8E98]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#6A8E98] text-xs whitespace-nowrap">
                          {fmt(item.updated_at)}
                        </td>
                      </tr>
                      {isOpen && item.lead_id && (
                        <tr key={`${item.id}-attempts`} className="border-b border-[#1d9fa9]/10 bg-[#0B1A1E]/40">
                          <td colSpan={6} className="p-0">
                            <AttemptsPanel leadId={item.lead_id} asesores={asesores} />
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((item) => {
              const isOpen = expanded.has(item.id);
              const lead = item.leads;
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-[#1d9fa9]/20 bg-[#0F2229] overflow-hidden"
                >
                  <button
                    type="button"
                    className="w-full text-left px-4 py-3 flex items-start gap-3"
                    onClick={() => toggleExpand(item.id)}
                  >
                    <span className="mt-0.5 text-[#6A8E98] flex-shrink-0">
                      {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-medium text-[#E4EEF0] text-sm truncate">
                          {lead?.nombre ?? "—"}
                        </span>
                        <QueueBadge estado={item.estado} />
                      </div>
                      {lead?.telefono && (
                        <div className="text-xs text-[#6A8E98] font-mono mt-0.5">{lead.telefono}</div>
                      )}
                      {lead?.cotizacion_enviada_at && item.lead_id && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setCotizacionLead({ id: item.lead_id!, nombre: lead.nombre ?? "este lead" }); }}
                          className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        >
                          <Receipt className="w-3 h-3" />
                          Cotización{lead.cotizacion_monto ? ` $${Number(lead.cotizacion_monto).toLocaleString()}` : ""} · Ver
                        </button>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-[#6A8E98]">
                        <span>{item.client_attempts ?? 0} intento(s)</span>
                        <span>{fmt(item.updated_at)}</span>
                      </div>
                    </div>
                  </button>
                  {isOpen && item.lead_id && (
                    <div className="border-t border-[#1d9fa9]/10">
                      <AttemptsPanel leadId={item.lead_id} asesores={asesores} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {cotizacionLead && (
        <CotizacionModal
          leadId={cotizacionLead.id}
          nombre={cotizacionLead.nombre}
          onClose={() => setCotizacionLead(null)}
        />
      )}
    </div>
  );
}
