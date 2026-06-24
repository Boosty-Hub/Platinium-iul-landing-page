// ScorecardPage — per-advisor performance scorecard (Slice 3).
// Admin-only: calls advisor_scorecard SECDEF RPC.
// CSS bar chart for calls_by_hour — no chart library.
import { useEffect, useState } from "react";
import { RefreshCw, TrendingUp, Phone, Clock, Star, Mic, FileText, Users } from "lucide-react";
import { listAsesores, getAdvisorScorecard } from "@/lib/adminApi";
import type { Asesor, AdvisorScorecard } from "@/lib/adminApi";

function pct(v: number): string {
  return (v * 100).toFixed(1) + "%";
}

function fmtSec(sec: number): string {
  if (!sec) return "0s";
  if (sec < 60) return `${Math.round(sec)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accent?: string;
}

function MetricCard({ label, value, sub, icon: Icon, accent = "text-[#1d9fa9]" }: MetricCardProps) {
  return (
    <div className="bg-[#0F2229] border border-[#1d9fa9]/15 rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${accent}`} />
        <span className="text-xs text-[#6A8E98] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div>
        <div className={`text-2xl font-bold ${accent}`}>{value}</div>
        {sub && <div className="text-xs text-[#6A8E98] mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function HourlyBar({ data }: { data: Record<string, number> }) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const max = Math.max(...Object.values(data), 1);

  return (
    <div className="bg-[#0F2229] border border-[#1d9fa9]/15 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-[#1d9fa9]" />
        <span className="text-xs text-[#6A8E98] font-medium uppercase tracking-wider">
          Llamadas por hora (horario EST)
        </span>
      </div>
      <div className="flex items-end gap-1 h-24">
        {hours.map((h) => {
          const count = data[String(h)] ?? 0;
          const heightPct = (count / max) * 100;
          return (
            <div key={h} className="flex-1 flex flex-col items-center gap-1" title={`${h}:00 — ${count} llamadas`}>
              <div className="w-full flex items-end" style={{ height: "80px" }}>
                <div
                  className="w-full rounded-t bg-[#1d9fa9]/60 hover:bg-[#1d9fa9] transition-colors"
                  style={{ height: `${Math.max(heightPct, count > 0 ? 8 : 2)}%` }}
                />
              </div>
              {/* Show hour every 4h to avoid clutter */}
              {h % 4 === 0 && (
                <span className="text-[9px] text-[#6A8E98]">{h}h</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QualityScore({ score }: { score: number }) {
  const pctScore = Math.round(score * 100);
  const color =
    pctScore >= 70 ? "text-emerald-400" : pctScore >= 40 ? "text-yellow-400" : "text-orange-400";
  const borderColor =
    pctScore >= 70 ? "border-emerald-400/30" : pctScore >= 40 ? "border-yellow-400/30" : "border-orange-400/30";
  const bgColor =
    pctScore >= 70 ? "bg-emerald-400/10" : pctScore >= 40 ? "bg-yellow-400/10" : "bg-orange-400/10";

  return (
    <div className={`bg-[#0F2229] border ${borderColor} rounded-2xl p-5 space-y-3`}>
      <div className="flex items-center gap-2">
        <Star className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-[#6A8E98] font-medium uppercase tracking-wider">
          Score de calidad
        </span>
      </div>
      <div className={`text-4xl font-bold ${color}`}>{pctScore}%</div>
      <div className={`h-2 rounded-full ${bgColor} overflow-hidden`}>
        <div
          className={`h-full rounded-full ${
            pctScore >= 70 ? "bg-emerald-400" : pctScore >= 40 ? "bg-yellow-400" : "bg-orange-400"
          } transition-all`}
          style={{ width: `${pctScore}%` }}
        />
      </div>
      <p className="text-[11px] text-[#6A8E98]">
        Índice de efectividad
      </p>
    </div>
  );
}

// ── Date helpers ──────────────────────────────────────────────────────────────
function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function todayEndISO(): string {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

export default function ScorecardPage() {
  const [asesores, setAsesores] = useState<Asesor[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>(daysAgoISO(30).slice(0, 10));
  const [toDate, setToDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [scorecard, setScorecard] = useState<AdvisorScorecard | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAsesores, setLoadingAsesores] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load asesor list
  useEffect(() => {
    listAsesores()
      .then((list) => {
        const active = list.filter((a) => a.activo);
        setAsesores(active);
        if (active.length > 0) setSelectedId(active[0].id);
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoadingAsesores(false));
  }, []);

  const loadScorecard = async () => {
    if (!selectedId) return;
    setLoading(true);
    setError(null);
    try {
      const from = new Date(fromDate + "T00:00:00").toISOString();
      const to   = new Date(toDate  + "T23:59:59").toISOString();
      const data = await getAdvisorScorecard(selectedId, from, to);
      setScorecard(data);
    } catch (e) {
      setError((e as Error).message);
      setScorecard(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-load when asesor selection is ready
  useEffect(() => {
    if (selectedId) loadScorecard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const selectedAsesor = asesores.find((a) => a.id === selectedId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#E4EEF0]">Scorecard de Asesor</h1>
        <p className="text-sm text-[#94B3BB] mt-1">Métricas de rendimiento por asesor y rango de fechas</p>
      </div>

      {/* Filters */}
      <div className="bg-[#0F2229] border border-[#1d9fa9]/20 rounded-2xl p-5">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Asesor selector */}
          <div className="space-y-1.5 flex-1 min-w-[180px]">
            <label className="text-xs text-[#6A8E98] font-medium uppercase tracking-wider">
              Asesor
            </label>
            {loadingAsesores ? (
              <div className="h-10 rounded-xl bg-[#1d9fa9]/5 animate-pulse" />
            ) : (
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full h-10 rounded-xl bg-[#0B1A1E] border border-[#1d9fa9]/25 text-[#E4EEF0] text-sm px-3 focus:outline-none focus:border-[#1d9fa9]/60"
              >
                {asesores.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
                {asesores.length === 0 && (
                  <option value="">Sin asesores activos</option>
                )}
              </select>
            )}
          </div>

          {/* Date from */}
          <div className="space-y-1.5">
            <label className="text-xs text-[#6A8E98] font-medium uppercase tracking-wider">Desde</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-10 rounded-xl bg-[#0B1A1E] border border-[#1d9fa9]/25 text-[#E4EEF0] text-sm px-3 focus:outline-none focus:border-[#1d9fa9]/60"
            />
          </div>

          {/* Date to */}
          <div className="space-y-1.5">
            <label className="text-xs text-[#6A8E98] font-medium uppercase tracking-wider">Hasta</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-10 rounded-xl bg-[#0B1A1E] border border-[#1d9fa9]/25 text-[#E4EEF0] text-sm px-3 focus:outline-none focus:border-[#1d9fa9]/60"
            />
          </div>

          {/* Apply button */}
          <button
            onClick={loadScorecard}
            disabled={loading || !selectedId}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1d9fa9] text-white text-sm font-semibold hover:bg-[#1d9fa9]/80 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Calculando..." : "Calcular"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
          Error: {error}
        </div>
      )}

      {scorecard && !loading && (
        <>
          {/* Asesor name + period */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#1d9fa9]" />
              <span className="text-lg font-semibold text-[#E4EEF0]">
                {selectedAsesor?.nombre ?? selectedId}
              </span>
            </div>
            <span className="text-sm text-[#6A8E98]">
              {fromDate} → {toDate}
            </span>
          </div>

          {/* Quality score (prominent) */}
          <QualityScore score={scorecard.quality_score} />

          {/* Metric cards grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Total marcaciones"
              value={String(scorecard.dials)}
              icon={Phone}
            />
            <MetricCard
              label="Tasa respuesta asesor"
              value={pct(scorecard.advisor_answer_rate)}
              sub={`${Math.round(scorecard.advisor_answer_rate * scorecard.dials)} de ${scorecard.dials} marcaciones`}
              icon={TrendingUp}
            />
            <MetricCard
              label="Tasa contacto cliente"
              value={pct(scorecard.client_contact_rate)}
              sub={`${Math.round(scorecard.client_contact_rate * scorecard.dials)} contactados`}
              icon={TrendingUp}
              accent="text-emerald-400"
            />
            <MetricCard
              label="Timbrado promedio"
              value={fmtSec(scorecard.avg_ring_sec)}
              icon={Clock}
              accent="text-orange-400"
            />
            <MetricCard
              label="Conversación promedio"
              value={fmtSec(scorecard.avg_talk_sec)}
              icon={Clock}
              accent="text-blue-400"
            />
            <MetricCard
              label="Leads únicos contactados"
              value={String(scorecard.unique_leads_contacted)}
              icon={Users}
            />
            <MetricCard
              label="Grabaciones"
              value={String(scorecard.recordings_count)}
              icon={Mic}
              accent="text-purple-400"
            />
            <MetricCard
              label="Tasa de notas"
              value={pct(scorecard.notes_rate)}
              sub={`${Math.round(scorecard.notes_rate * scorecard.dials)} notas`}
              icon={FileText}
              accent="text-yellow-400"
            />
          </div>

          {/* Hourly distribution */}
          <HourlyBar data={scorecard.calls_by_hour ?? {}} />
        </>
      )}

      {!scorecard && !loading && !error && selectedId && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
          <TrendingUp className="w-10 h-10 text-[#1d9fa9]/30" />
          <p className="text-[#6A8E98] text-sm">Selecciona un asesor y aplica el filtro para ver métricas.</p>
        </div>
      )}
    </div>
  );
}
