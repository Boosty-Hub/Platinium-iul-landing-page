// LeadDetailSheet — drawer with lead summary + timeline of calls/dispositions/cotizaciones.
// Teal dark theme. Non-technical copy for advisors.
import { useEffect, useState } from "react";
import {
  X, Phone, PhoneCall, Clock, Calendar, ThumbsUp, ThumbsDown,
  CheckCircle2, Send, XCircle, Play, FileText, RefreshCw, Eye, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import {
  getLeadHistory,
  callLead,
  previewCotizacion,
  sendCotizacion,
} from "@/lib/asesorApi";
import type { LeadInfo, TimelineEntry, TimelineLlamada, TimelineDisposicion, TimelineCotizacion } from "@/lib/asesorApi";
import { OUTCOME_LABELS, DISPOSICION_LABELS, fmtDuration, fmtRelative, fmtRelativeAny } from "@/lib/labels";
import DispositionSheet from "./DispositionSheet";

// ── Disposition icon map ──────────────────────────────────────────────────────
function DisposicionIcon({ key: d }: { key: string }) {
  const cls = "w-4 h-4 flex-shrink-0";
  switch (d) {
    case "ganado":             return <CheckCircle2 className={`${cls} text-emerald-400`} />;
    case "interesado":         return <ThumbsUp className={`${cls} text-[#1d9fa9]`} />;
    case "llamar_despues":     return <Clock className={`${cls} text-blue-400`} />;
    case "cotizacion_enviada": return <Send className={`${cls} text-purple-400`} />;
    case "cita_agendada":      return <Calendar className={`${cls} text-emerald-400`} />;
    case "no_interesado":      return <ThumbsDown className={`${cls} text-[#6A8E98]`} />;
    case "no_contesto":        return <Phone className={`${cls} text-orange-400`} />;
    case "numero_equivocado":  return <XCircle className={`${cls} text-red-400`} />;
    default:                   return <FileText className={`${cls} text-[#6A8E98]`} />;
  }
}

function disposicionColor(d: string): string {
  switch (d) {
    case "ganado":             return "text-emerald-400";
    case "interesado":         return "text-[#1d9fa9]";
    case "llamar_despues":     return "text-blue-400";
    case "cotizacion_enviada": return "text-purple-400";
    case "cita_agendada":      return "text-emerald-400";
    case "no_interesado":      return "text-[#6A8E98]";
    case "no_contesto":        return "text-orange-400";
    case "numero_equivocado":  return "text-red-400";
    default:                   return "text-[#94B3BB]";
  }
}

// ── Timeline items ────────────────────────────────────────────────────────────
function LlamadaItem({ entry }: { entry: TimelineLlamada }) {
  const outcomeLabel = OUTCOME_LABELS[entry.outcome ?? ""] ?? entry.outcome ?? "—";
  const hasAudio = !!entry.recording;

  return (
    <div className="flex gap-3">
      {/* Icon column */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-[#1d9fa9]/15 flex items-center justify-center">
          <PhoneCall className="w-4 h-4 text-[#1d9fa9]" />
        </div>
        <div className="w-px flex-1 bg-[#1d9fa9]/15" />
      </div>
      {/* Content */}
      <div className="pb-4 min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-[#E4EEF0]">Llamada</span>
          <span className="text-xs text-[#6A8E98]">{fmtRelative(entry.fecha)}</span>
        </div>
        <div className="mt-1.5 bg-[#0B1A1E] rounded-lg p-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6A8E98]">Resultado:</span>
            <span className="text-xs font-medium text-[#94B3BB]">{outcomeLabel}</span>
          </div>
          {(entry.ring_time_sec != null || entry.talk_time_sec != null) && (
            <div className="flex gap-3 text-xs text-[#6A8E98]">
              {entry.ring_time_sec != null && <span>Timbre: {fmtDuration(entry.ring_time_sec)}</span>}
              {entry.talk_time_sec != null && <span>Conversación: {fmtDuration(entry.talk_time_sec)}</span>}
            </div>
          )}
          {entry.nota && (
            <p className="text-xs text-[#94B3BB] italic border-t border-[#1d9fa9]/10 pt-1.5 mt-1">
              "{entry.nota}"
            </p>
          )}
          {hasAudio && (
            <div className="flex items-center gap-1.5 pt-1">
              <Play className="w-3.5 h-3.5 text-[#1d9fa9]" />
              <a
                href={entry.recording!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#1d9fa9] hover:underline"
              >
                Escuchar grabación
              </a>
            </div>
          )}
        </div>
        {entry.asesor && (
          <p className="text-[10px] text-[#6A8E98] mt-1">por {entry.asesor}</p>
        )}
      </div>
    </div>
  );
}

function DisposicionItem({ entry }: { entry: TimelineDisposicion }) {
  const label = DISPOSICION_LABELS[entry.disposicion] ?? entry.disposicion;
  const color = disposicionColor(entry.disposicion);

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-[#0F2229] border border-[#1d9fa9]/20 flex items-center justify-center">
          <DisposicionIcon key={entry.disposicion} />
        </div>
        <div className="w-px flex-1 bg-[#1d9fa9]/15" />
      </div>
      <div className="pb-4 min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-medium ${color}`}>{label}</span>
          <span className="text-xs text-[#6A8E98]">{fmtRelative(entry.fecha)}</span>
        </div>
        {entry.nota && (
          <p className="text-xs text-[#94B3BB] italic mt-1">"{entry.nota}"</p>
        )}
        {entry.programado_para && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-blue-400">
            <Calendar className="w-3 h-3" />
            <span>Recontacto: {fmtRelativeAny(entry.programado_para)}</span>
          </div>
        )}
        {entry.asesor && (
          <p className="text-[10px] text-[#6A8E98] mt-1">por {entry.asesor}</p>
        )}
      </div>
    </div>
  );
}

function CotizacionItem({ entry }: { entry: TimelineCotizacion }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-purple-500/15 flex items-center justify-center">
          <Send className="w-4 h-4 text-purple-400" />
        </div>
        <div className="w-px flex-1 bg-[#1d9fa9]/15" />
      </div>
      <div className="pb-4 min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-purple-400">Cotización enviada</span>
          <span className="text-xs text-[#6A8E98]">{fmtRelative(entry.fecha)}</span>
        </div>
        {entry.monto != null && (
          <p className="text-xs text-[#94B3BB] mt-0.5">
            ${entry.monto.toLocaleString("es")}/mes
          </p>
        )}
        {entry.asesor && (
          <p className="text-[10px] text-[#6A8E98] mt-1">por {entry.asesor}</p>
        )}
      </div>
    </div>
  );
}

// ── Disposition pill ──────────────────────────────────────────────────────────
function DisposicionPill({ d }: { d: string | null }) {
  if (!d) return <span className="text-xs text-[#6A8E98]">Sin resultado aún</span>;
  const label = DISPOSICION_LABELS[d] ?? d;
  const color = disposicionColor(d);
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-[#0B1A1E] border border-[#1d9fa9]/20 ${color}`}>
      <DisposicionIcon key={d} />
      {label}
    </span>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  leadId: string;
  onClose: () => void;
  onRefresh: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function LeadDetailSheet({ leadId, onClose, onRefresh }: Props) {
  const [lead, setLead] = useState<LeadInfo | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDisposition, setShowDisposition] = useState(false);
  const [callingId, setCallingId] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getLeadHistory(leadId);
      setLead(result.lead);
      setTimeline(result.timeline);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHistory(); }, [leadId]);

  const handleCall = async () => {
    if (!lead) return;
    const confirmed = window.confirm(
      `¿Llamar a ${lead.nombre}? Tu teléfono sonará primero, luego el del cliente.`
    );
    if (!confirmed) return;
    setCallingId(true);
    try {
      await callLead(leadId);
      toast.success(`Llamando a ${lead.nombre}…`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCallingId(false);
    }
  };

  const handlePreview = async () => {
    setPreviewLoading(true);
    try {
      const result = await previewCotizacion(leadId);
      setPreviewHtml(result.html);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSendCotizacion = async () => {
    if (!lead) return;
    try {
      const result = await sendCotizacion(leadId);
      toast.success(`Cotización enviada a ${result.to}`);
      loadHistory(); // refresh timeline
      onRefresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-end bg-black/60 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* Drawer panel — slides in from right on desktop, bottom on mobile */}
        <div className="relative h-full sm:w-[480px] w-full bg-[#0B1A1E] border-l border-[#1d9fa9]/20 shadow-2xl flex flex-col overflow-hidden sm:rounded-l-2xl rounded-t-2xl sm:rounded-r-none max-h-full">
          {/* Handle (mobile) */}
          <div className="sm:hidden flex justify-center pt-3">
            <div className="w-10 h-1 rounded-full bg-[#1d9fa9]/30" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1d9fa9]/20 flex-shrink-0">
            <h2 className="text-base font-semibold text-[#E4EEF0]">Detalle del lead</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[#6A8E98] hover:text-[#E4EEF0] hover:bg-[#1d9fa9]/10 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-6 h-6 text-[#1d9fa9] animate-spin" />
              </div>
            )}

            {error && (
              <div className="m-5 bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {!loading && lead && (
              <div className="px-5 pb-5 space-y-5">
                {/* Lead header card */}
                <div className="pt-4 space-y-3">
                  <div>
                    <h3 className="text-xl font-bold text-[#E4EEF0]">{lead.nombre}</h3>
                    {lead.telefono && (
                      <a
                        href={`tel:${lead.telefono}`}
                        className="text-[#1d9fa9] font-mono text-sm hover:underline"
                      >
                        {lead.telefono}
                      </a>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-[#6A8E98]">
                    {lead.edad && <span className="bg-[#0F2229] px-2 py-1 rounded-lg border border-[#1d9fa9]/15">{lead.edad} años</span>}
                    {lead.genero && <span className="bg-[#0F2229] px-2 py-1 rounded-lg border border-[#1d9fa9]/15 capitalize">{lead.genero}</span>}
                    {lead.email && <span className="bg-[#0F2229] px-2 py-1 rounded-lg border border-[#1d9fa9]/15">{lead.email}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#6A8E98]">Estado actual:</span>
                    <DisposicionPill d={lead.disposicion_actual} />
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={handleCall}
                    disabled={callingId}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1d9fa9]/10 border border-[#1d9fa9]/30 text-[#1d9fa9] text-xs font-medium hover:bg-[#1d9fa9]/20 transition-colors disabled:opacity-50"
                  >
                    {callingId ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PhoneCall className="w-3.5 h-3.5" />}
                    {callingId ? "Llamando…" : "Llamar"}
                  </button>
                  <button
                    onClick={() => setShowDisposition(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0F2229] border border-[#1d9fa9]/25 text-[#94B3BB] text-xs font-medium hover:text-[#E4EEF0] hover:border-[#1d9fa9]/50 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Registrar resultado
                  </button>
                  <button
                    onClick={handlePreview}
                    disabled={previewLoading}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0F2229] border border-[#1d9fa9]/25 text-[#94B3BB] text-xs font-medium hover:text-[#E4EEF0] hover:border-[#1d9fa9]/50 transition-colors disabled:opacity-50"
                  >
                    {previewLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                    Cotización
                  </button>
                  <button
                    onClick={handleSendCotizacion}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Enviar cotización
                  </button>
                  {lead.kommo_lead_id && lead.kommo_subdominio && (
                    <a
                      href={`https://${lead.kommo_subdominio}.kommo.com/leads/detail/${lead.kommo_lead_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0F2229] border border-[#1d9fa9]/25 text-[#94B3BB] text-xs font-medium hover:text-[#E4EEF0] hover:border-[#1d9fa9]/50 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Ir a Kommo
                    </a>
                  )}
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="text-xs font-semibold text-[#6A8E98] uppercase tracking-wider mb-4">
                    Historial de interacciones
                  </h4>
                  {timeline.length === 0 ? (
                    <div className="text-center py-8 text-sm text-[#6A8E98]">
                      Todavía no hay interacciones registradas.
                    </div>
                  ) : (
                    <div>
                      {timeline.map((entry, i) => {
                        const isLast = i === timeline.length - 1;
                        return (
                          <div key={`${entry.tipo}-${entry.fecha}-${i}`} className={isLast ? "[&>div>div:first-child>div:last-child]:hidden" : ""}>
                            {entry.tipo === "llamada" && <LlamadaItem entry={entry as TimelineLlamada} />}
                            {entry.tipo === "disposicion" && <DisposicionItem entry={entry as TimelineDisposicion} />}
                            {entry.tipo === "cotizacion" && <CotizacionItem entry={entry as TimelineCotizacion} />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nested DispositionSheet */}
      {showDisposition && lead && (
        <DispositionSheet
          leadId={leadId}
          nombre={lead.nombre}
          onClose={() => setShowDisposition(false)}
          onSuccess={() => {
            loadHistory();
            onRefresh();
          }}
        />
      )}

      {/* Cotización preview modal */}
      {previewHtml && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative bg-[#0F2229] border border-[#1d9fa9]/30 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1d9fa9]/20 flex-shrink-0">
              <div>
                <h3 className="text-base font-semibold text-[#E4EEF0]">Vista previa — Cotización</h3>
                <p className="text-xs text-[#6A8E98] mt-0.5">Así verá el cliente el email</p>
              </div>
              <button
                onClick={() => setPreviewHtml(null)}
                className="p-2 rounded-lg text-[#94B3BB] hover:text-white hover:bg-[#1d9fa9]/10 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-white rounded-b-2xl">
              <iframe
                title="Vista previa de cotización"
                srcDoc={previewHtml}
                className="w-full h-full border-0"
                style={{ minHeight: "60vh" }}
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
