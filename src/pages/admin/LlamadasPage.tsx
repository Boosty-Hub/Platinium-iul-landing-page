import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PhoneCall, RefreshCw, ChevronDown, ChevronRight, Mic } from "lucide-react";

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
  call_queue_id: string | null;
  lead_id: string | null;
  asesor_id: string | null;
  tipo: string | null;
  rc_session_id: string | null;
  estado: AttemptEstado;
  inicio_at: string | null;
  fin_at: string | null;
  duracion_seg: number | null;
  recording_url: string | null;
  kommo_call_id: string | null;
  notas: string | null;
  created_at: string;
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

function AttemptBadge({ estado }: { estado: AttemptEstado }) {
  const b = ATTEMPT_BADGE[estado] ?? { label: estado, cls: "bg-[#6A8E98]/15 text-[#6A8E98] border-[#6A8E98]/25" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${b.cls}`}>
      {b.label}
    </span>
  );
}

// ─── Attempt list ──────────────────────────────────────────────────────────────

function AttemptsPanel({ leadId }: { leadId: string }) {
  const [attempts, setAttempts] = useState<CallAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (supabase as any)
      .from("call_attempts")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at")
      .then(({ data, error }: { data: CallAttempt[] | null; error: Error | null }) => {
        if (cancelled) return;
        if (!error && data) setAttempts(data);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [leadId]);

  if (loading) {
    return (
      <div className="px-6 py-4 text-[#6A8E98] text-sm animate-pulse">Cargando intentos…</div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="px-6 py-4 text-[#6A8E98] text-sm">No hay intentos registrados aún.</div>
    );
  }

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="rounded-lg border border-[#1d9fa9]/10 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1d9fa9]/10 bg-[#0B1A1E]/60">
              <th className="text-left px-3 py-2 text-[#6A8E98] font-medium">Fecha</th>
              <th className="text-left px-3 py-2 text-[#6A8E98] font-medium">Tipo</th>
              <th className="text-left px-3 py-2 text-[#6A8E98] font-medium">Estado</th>
              <th className="text-left px-3 py-2 text-[#6A8E98] font-medium">Duración</th>
              <th className="text-left px-3 py-2 text-[#6A8E98] font-medium">Grabación</th>
              <th className="text-left px-3 py-2 text-[#6A8E98] font-medium">Notas</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((a, idx) => (
              <tr
                key={a.id}
                className={`border-b border-[#1d9fa9]/10 last:border-0 ${idx % 2 === 0 ? "" : "bg-[#0B1A1E]/20"}`}
              >
                <td className="px-3 py-2.5 text-[#94B3BB] whitespace-nowrap">
                  {a.inicio_at
                    ? new Date(a.inicio_at).toLocaleString("es-US", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : new Date(a.created_at).toLocaleString("es-US", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                </td>
                <td className="px-3 py-2.5 text-[#94B3BB] capitalize">{a.tipo ?? "—"}</td>
                <td className="px-3 py-2.5">
                  <AttemptBadge estado={a.estado} />
                </td>
                <td className="px-3 py-2.5 text-[#94B3BB] whitespace-nowrap">
                  {a.duracion_seg != null ? `${a.duracion_seg}s` : "—"}
                </td>
                <td className="px-3 py-2.5">
                  {a.recording_url ? (
                    <div className="flex items-center gap-1.5">
                      <Mic className="w-3 h-3 text-[#1d9fa9] flex-shrink-0" />
                      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                      <audio
                        controls
                        src={a.recording_url}
                        className="h-6 w-36 min-w-0"
                        preload="none"
                      />
                    </div>
                  ) : (
                    <span className="text-[#6A8E98]">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-[#94B3BB] max-w-[160px] truncate">
                  {a.notas ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LlamadasPage() {
  const [queue, setQueue] = useState<CallQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await (supabase as any)
        .from("call_queue")
        .select("*, leads(nombre,telefono,email,created_at)")
        .order("updated_at", { ascending: false })
        .limit(200);
      if (err) throw err;
      setQueue((data as CallQueue[]) ?? []);
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
              El motor de llamadas se activa con la Fase 2.
            </p>
          </div>
        </div>
      )}

      {/* Table — desktop */}
      {!loading && !error && queue.length > 0 && (
        <>
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
                {queue.map((item, idx) => {
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
                        </td>
                        <td className="px-4 py-3">
                          <QueueBadge estado={item.estado} />
                          {item.ultimo_resultado && (
                            <div className="text-xs text-[#6A8E98] mt-1 max-w-[180px] truncate">
                              {item.ultimo_resultado}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#94B3BB]">
                          {item.client_attempts ?? 0}
                        </td>
                        <td className="px-4 py-3 text-[#94B3BB] text-xs font-mono">
                          {item.asesor_id ?? <span className="text-[#6A8E98]">—</span>}
                        </td>
                        <td className="px-4 py-3 text-[#6A8E98] text-xs whitespace-nowrap">
                          {fmt(item.updated_at)}
                        </td>
                      </tr>
                      {isOpen && item.lead_id && (
                        <tr key={`${item.id}-attempts`} className="border-b border-[#1d9fa9]/10 bg-[#0B1A1E]/40">
                          <td colSpan={6} className="p-0">
                            <AttemptsPanel leadId={item.lead_id} />
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
            {queue.map((item) => {
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
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-[#6A8E98]">
                        <span>{item.client_attempts ?? 0} intento(s)</span>
                        <span>{fmt(item.updated_at)}</span>
                      </div>
                    </div>
                  </button>
                  {isOpen && item.lead_id && (
                    <div className="border-t border-[#1d9fa9]/10">
                      <AttemptsPanel leadId={item.lead_id} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
