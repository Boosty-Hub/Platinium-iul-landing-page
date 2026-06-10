import { useState, useEffect, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import h337 from "heatmap.js";
import { supabase } from "@/integrations/supabase/client";

// ── Helpers ─────────────────────────────────────────────────────────────────

function toIso(d: Date) {
  return d.toISOString();
}

function subDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function fmtMs(ms: number) {
  if (ms < 1000) return "< 1s";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function fmtNum(n: number) {
  return new Intl.NumberFormat("es").format(n);
}

// ── RPC callers ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = (fn: string, params: Record<string, unknown>) =>
  (supabase as any).rpc(fn, params);

interface StatsResult {
  sessions: number;
  pageviews: number;
  avg_active_ms: number;
  avg_max_scroll: number;
}

interface ScrollPoint {
  pct: number;
  sessions_reached: number;
  pct_reached: number;
}

interface SectionRow {
  section: string;
  avg_active_ms: number;
  appearances: number;
}

interface ClickPoint {
  x: number;
  y: number;
  value: number;
}

interface KnownPath {
  path: string;
  pageviews: number;
}

interface Filter {
  path: string;
  from: string;
  to: string;
}

async function fetchStats(f: Filter): Promise<StatsResult | null> {
  const { data, error } = await rpc("analytics_session_stats", {
    p_path: f.path || null,
    p_from: toIso(new Date(f.from)),
    p_to: toIso(new Date(f.to + "T23:59:59")),
  });
  if (error) { console.error(error); return null; }
  return data as StatsResult;
}

async function fetchScrollDist(f: Filter): Promise<ScrollPoint[]> {
  const { data, error } = await rpc("analytics_scroll_distribution", {
    p_path: f.path || null,
    p_from: toIso(new Date(f.from)),
    p_to: toIso(new Date(f.to + "T23:59:59")),
  });
  if (error) { console.error(error); return []; }
  return (data ?? []) as ScrollPoint[];
}

async function fetchSections(f: Filter): Promise<SectionRow[]> {
  const { data, error } = await rpc("analytics_section_attention", {
    p_path: f.path || null,
    p_from: toIso(new Date(f.from)),
    p_to: toIso(new Date(f.to + "T23:59:59")),
  });
  if (error) { console.error(error); return []; }
  return (data ?? []) as SectionRow[];
}

async function fetchClicks(f: Filter): Promise<ClickPoint[]> {
  const { data, error } = await rpc("analytics_click_heatmap", {
    p_path: f.path || null,
    p_from: toIso(new Date(f.from)),
    p_to: toIso(new Date(f.to + "T23:59:59")),
  });
  if (error) { console.error(error); return []; }
  return (data ?? []) as ClickPoint[];
}

async function fetchPaths(f: Filter): Promise<KnownPath[]> {
  const { data, error } = await rpc("analytics_known_paths", {
    p_from: toIso(new Date(f.from)),
    p_to: toIso(new Date(f.to + "T23:59:59")),
  });
  if (error) { console.error(error); return []; }
  return (data ?? []) as KnownPath[];
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-[#0d1f26] border border-[#1d9fa9]/20 rounded-xl p-5">
      <p className="text-[11px] uppercase tracking-widest text-[#1d9fa9] mb-2">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-[#4A8A94] mt-1">{sub}</p>}
    </div>
  );
}

function Empty({ text = "Sin datos para el período seleccionado" }: { text?: string }) {
  return (
    <div className="flex items-center justify-center h-full min-h-[160px] text-[#4A8A94] text-sm">
      {text}
    </div>
  );
}

// ── Click heatmap ─────────────────────────────────────────────────────────────

function ClickHeatmap({ points }: { points: ClickPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<ReturnType<typeof h337.create> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!instanceRef.current) {
      instanceRef.current = h337.create({
        container: containerRef.current,
        radius: 28,
        maxOpacity: 0.7,
        minOpacity: 0,
        blur: 0.8,
        gradient: { "0.3": "#1d9fa9", "0.65": "#f97316", "1.0": "#ef4444" },
      });
    }
    const el = containerRef.current;
    const W = el.offsetWidth || 800;
    const H = el.offsetHeight || 500;

    if (points.length === 0) {
      instanceRef.current.setData({ max: 1, data: [] });
      return;
    }

    const max = Math.max(...points.map((p) => p.value));
    instanceRef.current.setData({
      max,
      data: points.map((p) => ({
        x: Math.round((p.x / 100) * W),
        y: Math.round((p.y / 100) * H),
        value: p.value,
      })),
    });
  }, [points]);

  return (
    <div className="relative w-full" style={{ height: 460 }}>
      {/* Page depth guide */}
      <div className="absolute inset-0 pointer-events-none select-none z-0">
        {["0%", "25%", "50%", "75%", "100%"].map((label, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 border-t border-dashed border-white/10 text-[10px] text-white/30 pl-2"
            style={{ top: `${i * 25}%` }}
          >
            {label} ↓
          </div>
        ))}
      </div>
      {/* heatmap.js canvas layer */}
      <div
        ref={containerRef}
        className="absolute inset-0 rounded-lg z-10"
        style={{ background: "transparent" }}
      />
      {points.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <Empty text="Sin clicks registrados en este período" />
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const DEFAULT_FROM = toInputDate(subDays(30));
const DEFAULT_TO   = toInputDate(new Date());

export default function AnalyticsPanel() {
  const [fromInput, setFromInput] = useState(DEFAULT_FROM);
  const [toInput,   setToInput]   = useState(DEFAULT_TO);
  const [pathInput, setPathInput] = useState("");

  // Applied filter — only changes when user clicks "Aplicar"
  const [filter, setFilter] = useState<Filter>({ path: "", from: DEFAULT_FROM, to: DEFAULT_TO });

  const apply = useCallback(() => {
    setFilter({ path: pathInput, from: fromInput, to: toInput });
  }, [pathInput, fromInput, toInput]);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: paths = [] } = useQuery({
    queryKey: ["analytics-paths", filter.from, filter.to],
    queryFn: () => fetchPaths(filter),
    staleTime: 60_000,
  });

  const { data: stats, isFetching: statsLoading } = useQuery({
    queryKey: ["analytics-stats", filter],
    queryFn: () => fetchStats(filter),
    staleTime: 60_000,
  });

  const { data: scrollDist = [] } = useQuery({
    queryKey: ["analytics-scroll", filter],
    queryFn: () => fetchScrollDist(filter),
    staleTime: 60_000,
  });

  const { data: sections = [] } = useQuery({
    queryKey: ["analytics-sections", filter],
    queryFn: () => fetchSections(filter),
    staleTime: 60_000,
  });

  const { data: clicks = [] } = useQuery({
    queryKey: ["analytics-clicks", filter],
    queryFn: () => fetchClicks(filter),
    staleTime: 60_000,
  });

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#071318] text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Helmet>
        <title>Analytics | Platinum Insurance</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Header */}
      <header className="border-b border-[#1d9fa9]/15 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Platinum" className="h-8 w-auto" />
          <span className="text-sm font-bold text-[#1d9fa9] tracking-widest uppercase">Analytics</span>
        </div>
        <span className="text-xs text-[#4A8A94]">Panel interno · No indexado</span>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── Filter bar ── */}
        <div className="bg-[#0d1f26] border border-[#1d9fa9]/20 rounded-xl p-5 flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1 min-w-[200px] flex-1">
            <label className="text-[11px] uppercase tracking-widest text-[#1d9fa9]">Página</label>
            <select
              value={pathInput}
              onChange={(e) => setPathInput(e.target.value)}
              className="bg-[#071318] border border-[#1d9fa9]/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1d9fa9]"
            >
              <option value="">Todas las páginas</option>
              {paths.map((p) => (
                <option key={p.path} value={p.path}>
                  {p.path} ({fmtNum(p.pageviews)} vistas)
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase tracking-widest text-[#1d9fa9]">Desde</label>
            <input
              type="date"
              value={fromInput}
              onChange={(e) => setFromInput(e.target.value)}
              className="bg-[#071318] border border-[#1d9fa9]/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1d9fa9]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase tracking-widest text-[#1d9fa9]">Hasta</label>
            <input
              type="date"
              value={toInput}
              onChange={(e) => setToInput(e.target.value)}
              className="bg-[#071318] border border-[#1d9fa9]/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1d9fa9]"
            />
          </div>

          <button
            onClick={apply}
            className="px-6 py-2 bg-gradient-to-br from-[#1d9fa9] to-[#177D85] text-white font-semibold rounded-lg text-sm hover:opacity-90 transition-opacity"
          >
            Aplicar
          </button>

          {statsLoading && (
            <span className="text-xs text-[#4A8A94] self-center animate-pulse">Cargando…</span>
          )}
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Sesiones"
            value={stats ? fmtNum(stats.sessions) : "—"}
            sub={filter.path || "Todas las páginas"}
          />
          <StatCard
            label="Páginas vistas"
            value={stats ? fmtNum(stats.pageviews) : "—"}
          />
          <StatCard
            label="Tiempo activo promedio"
            value={stats ? fmtMs(stats.avg_active_ms) : "—"}
            sub="Solo tiempo con la pestaña activa"
          />
          <StatCard
            label="Scroll promedio"
            value={stats ? `${Math.round(stats.avg_max_scroll)}%` : "—"}
            sub="Profundidad máxima alcanzada"
          />
        </div>

        {/* ── Abandonment + Section attention ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Abandonment curve */}
          <div className="bg-[#0d1f26] border border-[#1d9fa9]/20 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-1">Curva de abandono</h2>
            <p className="text-xs text-[#4A8A94] mb-5">
              % de sesiones que llegaron a cada profundidad de scroll
            </p>
            {scrollDist.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={scrollDist} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1d9fa9" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#1d9fa9" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1d3e48" />
                  <XAxis
                    dataKey="pct"
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fill: "#4A8A94", fontSize: 11 }}
                    label={{ value: "Scroll depth", position: "insideBottomRight", offset: -4, fill: "#4A8A94", fontSize: 11 }}
                  />
                  <YAxis
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fill: "#4A8A94", fontSize: 11 }}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    formatter={(v: number) => [`${v}%`, "Sesiones alcanzaron"]}
                    labelFormatter={(l) => `Scroll: ${l}%`}
                    contentStyle={{ background: "#0d1f26", border: "1px solid #1d9fa9", borderRadius: 8, fontSize: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="pct_reached"
                    stroke="#1d9fa9"
                    strokeWidth={2}
                    fill="url(#grad)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Empty />
            )}
          </div>

          {/* Section attention */}
          <div className="bg-[#0d1f26] border border-[#1d9fa9]/20 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-1">Atención por sección</h2>
            <p className="text-xs text-[#4A8A94] mb-5">
              Tiempo activo promedio que los usuarios pasan en cada sección
            </p>
            {sections.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={[...sections].sort((a, b) => b.avg_active_ms - a.avg_active_ms).slice(0, 10)}
                  layout="vertical"
                  margin={{ top: 0, right: 40, bottom: 0, left: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1d3e48" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => fmtMs(v)}
                    tick={{ fill: "#4A8A94", fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="section"
                    tick={{ fill: "#b0cdd3", fontSize: 11 }}
                    width={110}
                  />
                  <Tooltip
                    formatter={(v: number) => [fmtMs(v), "Tiempo activo promedio"]}
                    contentStyle={{ background: "#0d1f26", border: "1px solid #1d9fa9", borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="avg_active_ms" radius={[0, 4, 4, 0]}>
                    {sections.map((_, i) => {
                      const intensity = 1 - i / Math.max(sections.length - 1, 1);
                      const r = Math.round(29  + intensity * (40 - 29));
                      const g = Math.round(159 + intensity * (196 - 159));
                      const b = Math.round(169 + intensity * (207 - 169));
                      return <Cell key={i} fill={`rgb(${r},${g},${b})`} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty />
            )}
          </div>
        </div>

        {/* ── Click heatmap ── */}
        <div className="bg-[#0d1f26] border border-[#1d9fa9]/20 rounded-xl p-5">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="text-sm font-semibold text-white">Mapa de calor — Clicks</h2>
              <p className="text-xs text-[#4A8A94] mt-1">
                Coordenadas normalizadas: X = % ancho del viewport · Y = % del largo total de la página
              </p>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[#4A8A94] shrink-0">
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-[#1d9fa9]" />Bajo</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-[#f97316]" />Medio</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-[#ef4444]" />Alto</span>
            </div>
          </div>
          <div className="mt-4 rounded-lg overflow-hidden bg-[#071318] border border-[#1d3e48]">
            <ClickHeatmap points={clicks} />
          </div>
          {clicks.length > 0 && (
            <p className="text-[11px] text-[#4A8A94] mt-2 text-right">
              {fmtNum(clicks.reduce((s, p) => s + p.value, 0))} clicks registrados
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
