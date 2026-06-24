// ResumenPage — Admin overview dashboard (funnel + asesores + seguimientos).
// Admin-only: calls admin_overview SECDEF RPC. Pure CSS only, no chart libraries.
import { useEffect, useState } from "react";
import {
  RefreshCw,
  LayoutDashboard,
  Phone,
  TrendingUp,
  FileText,
  Trophy,
  XCircle,
  DollarSign,
  Clock,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { getAdminOverview } from "@/lib/adminApi";
import type { AdminOverview } from "@/lib/adminApi";

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysAgoDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function fmtSec(sec: number): string {
  if (!sec) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function pctOf(num: number, denom: number): string {
  if (!denom) return "—";
  return ((num / denom) * 100).toFixed(1) + "%";
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accent?: string;
}

function KpiCard({ label, value, sub, icon: Icon, accent = "text-[#1d9fa9]" }: KpiCardProps) {
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

interface FunnelBarProps {
  label: string;
  count: number;
  max: number;
  pct?: string;
  color?: string;
}

function FunnelBar({ label, count, max, pct, color = "bg-[#1d9fa9]" }: FunnelBarProps) {
  const widthPct = max > 0 ? Math.max((count / max) * 100, count > 0 ? 4 : 0) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[#94B3BB] font-medium">{label}</span>
        <div className="flex items-center gap-3">
          {pct && <span className="text-[#6A8E98] text-xs">{pct}</span>}
          <span className="text-[#E4EEF0] font-bold w-12 text-right">{count.toLocaleString()}</span>
        </div>
      </div>
      <div className="h-3 bg-[#0B1A1E] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </div>
  );
}

interface FollowupCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  accent?: string;
  dimmed?: boolean;
}

function FollowupCard({ label, value, icon: Icon, accent = "text-[#1d9fa9]", dimmed }: FollowupCardProps) {
  return (
    <div
      className={`bg-[#0F2229] border rounded-2xl p-5 flex items-center gap-4 ${
        dimmed ? "border-[#1d9fa9]/10" : "border-[#1d9fa9]/20"
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-[#0B1A1E] ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className={`text-2xl font-bold ${accent}`}>{value.toLocaleString()}</div>
        <div className="text-xs text-[#6A8E98] mt-0.5">{label}</div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ResumenPage() {
  const [fromDate, setFromDate] = useState<string>(daysAgoDate(30));
  const [toDate, setToDate] = useState<string>(todayDate());
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const from = new Date(fromDate + "T00:00:00").toISOString();
      const to = new Date(toDate + "T23:59:59").toISOString();
      const result = await getAdminOverview(from, to);
      setData(result);
    } catch (e) {
      setError((e as Error).message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Funnel data for proportional bars
  const funnel = data?.funnel;
  const funnelMax = funnel?.leads ?? 1;

  // Asesor table sorted by ganados desc
  const asesores = [...(data?.asesores ?? [])].sort((a, b) => b.ganados - a.ganados);

  const seg = data?.seguimientos;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#E4EEF0]">Resumen</h1>
        <p className="text-sm text-[#94B3BB] mt-1">
          Visión general del embudo, asesores y seguimientos
        </p>
      </div>

      {/* Date filter */}
      <div className="bg-[#0F2229] border border-[#1d9fa9]/20 rounded-2xl p-5">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-xs text-[#6A8E98] font-medium uppercase tracking-wider">Desde</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-10 rounded-xl bg-[#0B1A1E] border border-[#1d9fa9]/25 text-[#E4EEF0] text-sm px-3 focus:outline-none focus:border-[#1d9fa9]/60"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-[#6A8E98] font-medium uppercase tracking-wider">Hasta</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-10 rounded-xl bg-[#0B1A1E] border border-[#1d9fa9]/25 text-[#E4EEF0] text-sm px-3 focus:outline-none focus:border-[#1d9fa9]/60"
            />
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1d9fa9] text-white text-sm font-semibold hover:bg-[#1d9fa9]/80 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Cargando..." : "Aplicar"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
          Error: {error}
        </div>
      )}

      {loading && !data && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-[#0F2229] animate-pulse" />
          ))}
        </div>
      )}

      {data && (
        <>
          {/* ── KPI cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <KpiCard
              label="Leads"
              value={funnel!.leads.toLocaleString()}
              icon={LayoutDashboard}
            />
            <KpiCard
              label="Contactados"
              value={funnel!.contactados.toLocaleString()}
              sub={pctOf(funnel!.contactados, funnel!.leads) + " de leads"}
              icon={Phone}
              accent="text-blue-400"
            />
            <KpiCard
              label="Cotizaciones"
              value={funnel!.cotizaciones.toLocaleString()}
              sub={pctOf(funnel!.cotizaciones, funnel!.contactados) + " de contactados"}
              icon={FileText}
              accent="text-violet-400"
            />
            <KpiCard
              label="Ganados"
              value={funnel!.ganados.toLocaleString()}
              sub={pctOf(funnel!.ganados, funnel!.cotizaciones) + " de cotizaciones"}
              icon={Trophy}
              accent="text-emerald-400"
            />
            <KpiCard
              label="No avanzaron"
              value={funnel!.perdidos.toLocaleString()}
              icon={XCircle}
              accent="text-orange-400"
            />
            <KpiCard
              label="Prima promedio"
              value={funnel!.monto_prom > 0 ? `$${funnel!.monto_prom.toLocaleString()}` : "—"}
              sub="en cotizaciones enviadas"
              icon={DollarSign}
              accent="text-yellow-400"
            />
          </div>

          {/* ── Funnel visual ── */}
          <div className="bg-[#0F2229] border border-[#1d9fa9]/15 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-4 h-4 text-[#1d9fa9]" />
              <span className="text-xs text-[#6A8E98] font-medium uppercase tracking-wider">
                Embudo de conversión
              </span>
            </div>
            <div className="space-y-4">
              <FunnelBar
                label="Leads recibidos"
                count={funnel!.leads}
                max={funnelMax}
                color="bg-[#1d9fa9]"
              />
              <FunnelBar
                label="Contactados"
                count={funnel!.contactados}
                max={funnelMax}
                pct={pctOf(funnel!.contactados, funnel!.leads)}
                color="bg-blue-500"
              />
              <FunnelBar
                label="Cotizaciones enviadas"
                count={funnel!.cotizaciones}
                max={funnelMax}
                pct={pctOf(funnel!.cotizaciones, funnel!.leads)}
                color="bg-violet-500"
              />
              <FunnelBar
                label="Ganados"
                count={funnel!.ganados}
                max={funnelMax}
                pct={pctOf(funnel!.ganados, funnel!.leads)}
                color="bg-emerald-500"
              />
            </div>
          </div>

          {/* ── Asesores comparison table ── */}
          {asesores.length > 0 && (
            <div className="bg-[#0F2229] border border-[#1d9fa9]/15 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-[#1d9fa9]/10">
                <Phone className="w-4 h-4 text-[#1d9fa9]" />
                <span className="text-xs text-[#6A8E98] font-medium uppercase tracking-wider">
                  Comparativa por asesor
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1d9fa9]/10">
                      <th className="text-left px-6 py-3 text-xs text-[#6A8E98] font-medium uppercase tracking-wider">
                        Asesor
                      </th>
                      <th className="text-right px-4 py-3 text-xs text-[#6A8E98] font-medium uppercase tracking-wider">
                        Cartera
                      </th>
                      <th className="text-right px-4 py-3 text-xs text-[#6A8E98] font-medium uppercase tracking-wider">
                        Marcaciones
                      </th>
                      <th className="text-right px-4 py-3 text-xs text-[#6A8E98] font-medium uppercase tracking-wider">
                        Contactados
                      </th>
                      <th className="text-right px-4 py-3 text-xs text-[#6A8E98] font-medium uppercase tracking-wider">
                        Cotizaciones
                      </th>
                      <th className="text-right px-4 py-3 text-xs text-[#6A8E98] font-medium uppercase tracking-wider">
                        Ganados
                      </th>
                      <th className="text-right px-4 py-3 text-xs text-[#6A8E98] font-medium uppercase tracking-wider">
                        Conv. prom.
                      </th>
                      <th className="text-right px-6 py-3 text-xs text-[#6A8E98] font-medium uppercase tracking-wider">
                        Seguimientos
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1d9fa9]/8">
                    {asesores.map((a) => (
                      <tr
                        key={a.id}
                        className="hover:bg-[#1d9fa9]/5 transition-colors"
                      >
                        <td className="px-6 py-3.5 text-[#E4EEF0] font-medium">{a.nombre}</td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <span className="text-[#E4EEF0] font-semibold">{a.cartera.toLocaleString()}</span>
                          {a.cartera_activa > 0 && (
                            <span className="text-[#6A8E98] text-xs"> · {a.cartera_activa} activos</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right text-[#94B3BB]">
                          {a.dials.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-right text-blue-400">
                          {a.contactados.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-right text-violet-400">
                          {a.cotizaciones.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="text-emerald-400 font-semibold">
                            {a.ganados.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right text-[#94B3BB]">
                          {fmtSec(a.avg_talk_sec)}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <span className="text-[#94B3BB]">{a.seg_pendientes} pend.</span>
                          {a.seg_vencidos > 0 && (
                            <span
                              className={`ml-2 font-semibold ${
                                a.seg_vencidos >= 3 ? "text-red-400" : "text-amber-400"
                              }`}
                            >
                              · {a.seg_vencidos} venc.
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {asesores.length === 0 && (
            <div className="bg-[#0F2229] border border-[#1d9fa9]/15 rounded-2xl p-8 text-center">
              <Phone className="w-8 h-8 text-[#1d9fa9]/30 mx-auto mb-2" />
              <p className="text-[#6A8E98] text-sm">No hay asesores activos registrados.</p>
            </div>
          )}

          {/* ── Seguimientos summary ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-[#1d9fa9]" />
              <span className="text-xs text-[#6A8E98] font-medium uppercase tracking-wider">
                Seguimientos pendientes
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FollowupCard
                label="Total pendientes"
                value={seg!.pendientes}
                icon={Clock}
                accent="text-[#1d9fa9]"
              />
              <FollowupCard
                label="Vencidos"
                value={seg!.vencidos}
                icon={AlertTriangle}
                accent={seg!.vencidos > 0 ? "text-red-400" : "text-[#6A8E98]"}
                dimmed={seg!.vencidos === 0}
              />
              <FollowupCard
                label="Para hoy (EST)"
                value={seg!.hoy}
                icon={Calendar}
                accent={seg!.hoy > 0 ? "text-amber-400" : "text-[#6A8E98]"}
                dimmed={seg!.hoy === 0}
              />
            </div>
          </div>
        </>
      )}

      {!data && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
          <LayoutDashboard className="w-10 h-10 text-[#1d9fa9]/30" />
          <p className="text-[#6A8E98] text-sm">Selecciona un rango y aplica el filtro.</p>
        </div>
      )}
    </div>
  );
}
