// MisLeadsPage — advisor's CRM list. Clean, no jargon.
// La etapa de Kommo NO se cambia a mano: se actualiza sola al "Registrar resultado"
// (la disposición sincroniza etapa + Status Call + Próxima cita + nota).
// Now includes: seguimiento filter chips, recontact pills, DispositionSheet, LeadDetailSheet.
import { useEffect, useState, useMemo, useRef } from "react";
import { RefreshCw, Phone, PhoneCall, Search, Users, Send, Eye, X, Clock, AlertCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  getMyLeads,
  callLead,
  previewCotizacion,
  sendCotizacion,
  getMisSeguimientos,
} from "@/lib/asesorApi";
import type { MyLead, MiSeguimiento } from "@/lib/asesorApi";
import { fmtRelative, fmtRelativeAny } from "@/lib/labels";
import DispositionSheet from "@/components/asesor/DispositionSheet";
import LeadDetailSheet from "@/components/asesor/LeadDetailSheet";

// ── Status config ────────────────────────────────────────────────────────────
const ESTADO_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  pending:      { label: "Por contactar", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",   dot: "bg-yellow-400" },
  scheduled:    { label: "Programado",    color: "bg-blue-500/15 text-blue-400 border-blue-500/25",         dot: "bg-blue-400" },
  in_progress:  { label: "En llamada",    color: "bg-[#1d9fa9]/15 text-[#1d9fa9] border-[#1d9fa9]/25",     dot: "bg-[#1d9fa9]" },
  contactado:   { label: "Contactado",    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", dot: "bg-emerald-400" },
  no_contactado:{ label: "Sin contacto",  color: "bg-orange-500/15 text-orange-400 border-orange-500/25",   dot: "bg-orange-400" },
  failed:       { label: "No disponible", color: "bg-red-500/15 text-red-400 border-red-500/25",            dot: "bg-red-400" },
  cancelled:    { label: "Cancelada",     color: "bg-[#6A8E98]/15 text-[#6A8E98] border-[#6A8E98]/25",     dot: "bg-[#6A8E98]" },
};

// ── Filter types ─────────────────────────────────────────────────────────────
type StatusFilter = "todos" | "por_contactar" | "contactados" | "no_contactados";
type TimeFilter = "hoy" | "7d" | "30d" | "todo";
type SeguimientoFilter = "todos" | "hoy" | "vencidos" | "semana";

const STATUS_BUCKETS: Record<StatusFilter, string[]> = {
  todos: [],
  por_contactar:   ["pending", "scheduled", "in_progress"],
  contactados:     ["contactado"],
  no_contactados:  ["no_contactado", "failed", "cancelled"],
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}
function startOfWeek(d: Date): Date {
  const day = d.getDay(); // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Mon
  return new Date(d.getFullYear(), d.getMonth(), diff);
}
function endOfWeek(d: Date): Date {
  const s = startOfWeek(d);
  return new Date(s.getFullYear(), s.getMonth(), s.getDate() + 6, 23, 59, 59, 999);
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatusPill({ estado }: { estado: string }) {
  const cfg = ESTADO_CONFIG[estado] ?? { label: estado, color: "bg-[#6A8E98]/15 text-[#6A8E98] border-[#6A8E98]/25", dot: "bg-[#6A8E98]" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function RecontactoPill({ seg }: { seg: MiSeguimiento }) {
  const isVencido = seg.estado === "pendiente" || seg.estado === "avisado"
    ? seg.programado_para != null && new Date(seg.programado_para) < new Date()
    : false;

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${
      isVencido
        ? "bg-red-500/10 border-red-500/25 text-red-400"
        : "bg-blue-500/10 border-blue-500/25 text-blue-400"
    }`}>
      {isVencido ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
      {isVencido ? "Vencido" : `Recontacto ${fmtRelativeAny(seg.programado_para)}`}
    </span>
  );
}

function Chip<T extends string>({
  value, current, label, badge, onClick,
}: { value: T; current: T; label: string; badge?: number; onClick: (v: T) => void }) {
  const active = value === current;
  return (
    <button
      onClick={() => onClick(value)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        active
          ? "bg-[#1d9fa9] text-white"
          : "bg-[#0F2229] border border-[#1d9fa9]/20 text-[#94B3BB] hover:border-[#1d9fa9]/50 hover:text-[#E4EEF0]"
      }`}
    >
      {label}
      {badge != null && badge > 0 && (
        <span className={`rounded-full px-1.5 py-px text-[10px] font-bold leading-none ${
          active ? "bg-white/25 text-white" : "bg-red-500/20 text-red-400"
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MisLeadsPage() {
  const [leads, setLeads] = useState<MyLead[]>([]);
  const [seguimientos, setSeguimientos] = useState<MiSeguimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [callingId, setCallingId] = useState<string | null>(null);
  const [sendingCotizId, setSendingCotizId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("todo");
  const [segFilter, setSegFilter] = useState<SeguimientoFilter>("todos");
  const [search, setSearch] = useState("");

  // Sheets
  const [dispositionLeadId, setDispositionLeadId] = useState<string | null>(null);
  const [dispositionNombre, setDispositionNombre] = useState<string>("");
  const [detailLeadId, setDetailLeadId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [leadsData, segsData] = await Promise.all([
        getMyLeads(),
        getMisSeguimientos().catch(() => [] as MiSeguimiento[]),
      ]);
      setLeads(leadsData);
      setSeguimientos(segsData);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Seguimiento index: lead_id → MiSeguimiento ────────────────────────────
  const segByLeadId = useMemo(() => {
    const map = new Map<string, MiSeguimiento>();
    for (const s of seguimientos) {
      if (!map.has(s.lead_id)) map.set(s.lead_id, s); // latest first (already sorted)
    }
    return map;
  }, [seguimientos]);

  // ── Seguimiento counts for badges ─────────────────────────────────────────
  const segCounts = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now).getTime();
    const todayEnd = endOfDay(now).getTime();
    const weekEnd = endOfWeek(now).getTime();
    const weekStart = startOfWeek(now).getTime();

    let hoy = 0, vencidos = 0, semana = 0;
    for (const s of seguimientos) {
      if (!s.programado_para) continue;
      const t = new Date(s.programado_para).getTime();
      if (t < now.getTime()) vencidos++;
      else if (t >= todayStart && t <= todayEnd) hoy++;
      if (t >= weekStart && t <= weekEnd) semana++;
    }
    return { hoy, vencidos, semana };
  }, [seguimientos]);

  // ── Filters ──────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now).getTime();
    const todayEnd = endOfDay(now).getTime();
    const weekStart = startOfWeek(now).getTime();
    const weekEnd = endOfWeek(now).getTime();

    return leads.filter((row) => {
      // Status filter
      const bucket = STATUS_BUCKETS[statusFilter];
      if (bucket.length > 0 && !bucket.includes(row.estado)) return false;

      // Time filter (based on scheduled_at)
      if (timeFilter !== "todo") {
        const ref = row.scheduled_at ? new Date(row.scheduled_at).getTime() : 0;
        const diff = now.getTime() - ref;
        if (timeFilter === "hoy" && diff > 86400000) return false;
        if (timeFilter === "7d"  && diff > 7 * 86400000) return false;
        if (timeFilter === "30d" && diff > 30 * 86400000) return false;
      }

      // Seguimiento filter
      if (segFilter !== "todos") {
        const seg = segByLeadId.get(row.lead_id);
        if (!seg || !seg.programado_para) return false;
        const t = new Date(seg.programado_para).getTime();
        if (segFilter === "hoy" && !(t >= todayStart && t <= todayEnd)) return false;
        if (segFilter === "vencidos" && !(t < now.getTime())) return false;
        if (segFilter === "semana" && !(t >= weekStart && t <= weekEnd)) return false;
      }

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const nombre = (row.lead?.nombre ?? "").toLowerCase();
        const tel = (row.lead?.telefono ?? "").toLowerCase();
        if (!nombre.includes(q) && !tel.includes(q)) return false;
      }

      return true;
    });
  }, [leads, statusFilter, timeFilter, segFilter, segByLeadId, search]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleCall = async (row: MyLead) => {
    const nombre = row.lead?.nombre ?? "este lead";
    const confirmed = window.confirm(
      `¿Llamar a ${nombre}? Tu teléfono sonará primero, luego el del cliente.`,
    );
    if (!confirmed) return;
    setCallingId(row.id);
    setError(null);
    try {
      await callLead(row.lead_id);
      toast.success(`Llamando a ${nombre}…`);
      // Apenas se coloca la llamada abrimos "Registrar resultado": así el asesor
      // actualiza TODO (etapa Kommo + Status Call + nota + recontacto) durante o
      // al terminar la llamada, sin tener que acordarse de un paso extra.
      setDispositionLeadId(row.lead_id);
      setDispositionNombre(nombre);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCallingId(null);
    }
  };

  const handleSendCotizacion = async (row: MyLead) => {
    setSendingCotizId(row.id);
    try {
      const result = await sendCotizacion(row.lead_id);
      toast.success(`Cotización enviada a ${result.to}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSendingCotizId(null);
    }
  };

  const handlePreviewCotizacion = async (row: MyLead) => {
    setPreviewingId(row.id);
    try {
      const result = await previewCotizacion(row.lead_id);
      setPreviewHtml(result.html);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPreviewingId(null);
    }
  };

  // ── Preview modal ─────────────────────────────────────────────────────────────
  const PreviewModal = previewHtml ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative bg-[#0F2229] border border-[#1d9fa9]/30 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal header */}
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
        {/* iframe preview */}
        <div className="flex-1 overflow-hidden bg-white rounded-b-2xl">
          <iframe
            ref={iframeRef}
            title="Vista previa de cotización"
            srcDoc={previewHtml}
            className="w-full h-full border-0"
            style={{ minHeight: "60vh" }}
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#E4EEF0]">Mis Leads</h1>
          <p className="text-sm text-[#94B3BB] mt-0.5">
            {filtered.length} lead{filtered.length !== 1 ? "s" : ""}
            {leads.length !== filtered.length ? ` de ${leads.length}` : ""}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1d9fa9]/10 border border-[#1d9fa9]/30 text-[#1d9fa9] text-sm font-medium hover:bg-[#1d9fa9]/20 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[#0F2229] border border-[#1d9fa9]/15 rounded-2xl p-4 space-y-3">
        {/* Status chips */}
        <div className="flex flex-wrap gap-2">
          <Chip value="todos" current={statusFilter} label="Todos" onClick={(v) => setStatusFilter(v)} />
          <Chip value="por_contactar" current={statusFilter} label="Por contactar" onClick={(v) => setStatusFilter(v)} />
          <Chip value="contactados" current={statusFilter} label="Contactados" onClick={(v) => setStatusFilter(v)} />
          <Chip value="no_contactados" current={statusFilter} label="No contactados" onClick={(v) => setStatusFilter(v)} />
        </div>

        {/* Seguimiento filter chips */}
        <div className="flex flex-wrap gap-2 items-center border-t border-[#1d9fa9]/10 pt-3">
          <span className="text-[10px] text-[#6A8E98] uppercase tracking-wider font-semibold">Seguimientos:</span>
          <Chip value="todos" current={segFilter} label="Todos" onClick={(v) => setSegFilter(v)} />
          <Chip value="hoy" current={segFilter} label="Hoy" badge={segCounts.hoy} onClick={(v) => setSegFilter(v)} />
          <Chip value="vencidos" current={segFilter} label="Vencidos" badge={segCounts.vencidos} onClick={(v) => setSegFilter(v)} />
          <Chip value="semana" current={segFilter} label="Esta semana" badge={segCounts.semana} onClick={(v) => setSegFilter(v)} />
        </div>

        {/* Time + search */}
        <div className="flex flex-wrap gap-2 items-center border-t border-[#1d9fa9]/10 pt-3">
          <div className="flex gap-1.5">
            <Chip value="hoy" current={timeFilter} label="Hoy" onClick={(v) => setTimeFilter(v)} />
            <Chip value="7d" current={timeFilter} label="7 días" onClick={(v) => setTimeFilter(v)} />
            <Chip value="30d" current={timeFilter} label="30 días" onClick={(v) => setTimeFilter(v)} />
            <Chip value="todo" current={timeFilter} label="Todo" onClick={(v) => setTimeFilter(v)} />
          </div>
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6A8E98]" />
            <input
              type="text"
              placeholder="Buscar por nombre o teléfono…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0B1A1E] border border-[#1d9fa9]/20 text-sm text-[#E4EEF0] placeholder:text-[#6A8E98] focus:outline-none focus:border-[#1d9fa9]/50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && leads.length === 0 && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-[#0F2229] border border-[#1d9fa9]/10 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border border-[#1d9fa9]/15 bg-[#0F2229]">
          <div className="w-12 h-12 rounded-full bg-[#1d9fa9]/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-[#1d9fa9]/60" />
          </div>
          <div className="text-center">
            <p className="text-[#E4EEF0] font-medium">
              {leads.length === 0 ? "Todavía no tenés leads asignados" : "Sin resultados para este filtro"}
            </p>
            <p className="text-sm text-[#6A8E98] mt-1">
              {leads.length === 0
                ? "Cuando te asignen uno, aparecerá acá."
                : "Probá cambiando los filtros o buscando con otras palabras."}
            </p>
          </div>
        </div>
      )}

      {/* Lead cards */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((row) => {
            const seg = segByLeadId.get(row.lead_id);
            return (
              <div
                key={row.id}
                className="bg-[#0F2229] border border-[#1d9fa9]/20 rounded-2xl p-4 space-y-3 hover:border-[#1d9fa9]/40 transition-colors"
              >
                {/* Lead info */}
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => setDetailLeadId(row.lead_id)}
                      className="text-base font-semibold text-[#E4EEF0] leading-tight text-left hover:text-[#1d9fa9] transition-colors"
                    >
                      {row.lead?.nombre ?? "Sin nombre"}
                    </button>
                    <StatusPill estado={row.estado} />
                  </div>
                  {row.lead?.telefono && (
                    <a
                      href={`tel:${row.lead.telefono}`}
                      className="flex items-center gap-1.5 text-sm text-[#94B3BB] hover:text-[#1d9fa9] transition-colors"
                    >
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      {row.lead.telefono}
                    </a>
                  )}
                  {row.lead?.interes && (
                    <p className="text-xs text-[#6A8E98]">{row.lead.interes}</p>
                  )}
                  {/* Seguimiento pill */}
                  {seg && (
                    <div className="pt-0.5">
                      <RecontactoPill seg={seg} />
                    </div>
                  )}
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-3 text-xs text-[#6A8E98]">
                  <span>{fmtRelative(row.scheduled_at)}</span>
                  {row.client_attempts > 0 && (
                    <>
                      <span className="w-px h-3 bg-[#1d9fa9]/20" />
                      <span>{row.client_attempts} intento{row.client_attempts !== 1 ? "s" : ""}</span>
                    </>
                  )}
                </div>

                {/* Primary action — la etapa de Kommo se actualiza sola al Registrar resultado */}
                <div className="flex items-center gap-2 pt-1 border-t border-[#1d9fa9]/10">
                  <button
                    onClick={() => handleCall(row)}
                    disabled={callingId === row.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1d9fa9]/10 border border-[#1d9fa9]/30 text-[#1d9fa9] text-xs font-medium hover:bg-[#1d9fa9]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1 justify-center"
                  >
                    {callingId === row.id ? (
                      <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Llamando…</>
                    ) : (
                      <><PhoneCall className="w-3.5 h-3.5" /> Llamar</>
                    )}
                  </button>
                </div>

                {/* Disposition + history actions */}
                <div className="flex items-center gap-2 border-t border-[#1d9fa9]/10 pt-2">
                  <button
                    onClick={() => {
                      setDispositionLeadId(row.lead_id);
                      setDispositionNombre(row.lead?.nombre ?? "este lead");
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1A1E] border border-[#1d9fa9]/20 text-[#94B3BB] text-xs font-medium hover:text-[#E4EEF0] hover:border-[#1d9fa9]/40 transition-colors flex-1 justify-center"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Registrar resultado
                  </button>
                  <button
                    onClick={() => setDetailLeadId(row.lead_id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1A1E] border border-[#1d9fa9]/20 text-[#94B3BB] text-xs font-medium hover:text-[#E4EEF0] hover:border-[#1d9fa9]/40 transition-colors flex-1 justify-center"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Ver historial
                  </button>
                </div>

                {/* Cotización actions */}
                <div className="flex items-center gap-2 border-t border-[#1d9fa9]/10 pt-2">
                  <button
                    onClick={() => handlePreviewCotizacion(row)}
                    disabled={previewingId === row.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1d9fa9]/20 text-[#6A8E98] text-xs font-medium hover:text-[#94B3BB] hover:border-[#1d9fa9]/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1 justify-center"
                  >
                    {previewingId === row.id ? (
                      <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Cargando…</>
                    ) : (
                      <><Eye className="w-3.5 h-3.5" /> Vista previa</>
                    )}
                  </button>
                  <button
                    onClick={() => handleSendCotizacion(row)}
                    disabled={sendingCotizId === row.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1 justify-center"
                  >
                    {sendingCotizId === row.id ? (
                      <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Enviando…</>
                    ) : (
                      <><Send className="w-3.5 h-3.5" /> Enviar cotización</>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview modal */}
      {PreviewModal}

      {/* DispositionSheet */}
      {dispositionLeadId && (
        <DispositionSheet
          leadId={dispositionLeadId}
          nombre={dispositionNombre}
          onClose={() => setDispositionLeadId(null)}
          onSuccess={load}
        />
      )}

      {/* LeadDetailSheet */}
      {detailLeadId && (
        <LeadDetailSheet
          leadId={detailLeadId}
          onClose={() => setDetailLeadId(null)}
          onRefresh={load}
        />
      )}
    </div>
  );
}
