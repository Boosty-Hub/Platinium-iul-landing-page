// DisponibilidadPage — cuántas horas estuvo Disponible cada asesor por día.
// Accountability: detecta de un vistazo quién no se conectó un día.
// Datos: tabla advisor_availability_daily (cron suma 1 min por asesor disponible).
import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Clock } from "lucide-react";
import { listAsesorUsers, getAvailabilityDaily } from "@/lib/adminApi";
import type { AvailabilityRow } from "@/lib/adminApi";

interface Advisor { id: string; nombre: string; }

// Fecha YYYY-MM-DD en horario de Chicago (igual que guarda el cron).
function chicagoDate(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(d);
}

function lastNDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return chicagoDate(d);
  });
}

function fmtHoras(min: number): string {
  if (!min) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function colDate(fecha: string): { dow: string; dm: string } {
  const d = new Date(fecha + "T12:00:00");
  return {
    dow: d.toLocaleDateString("es", { weekday: "short" }),
    dm: d.toLocaleDateString("es", { day: "numeric", month: "numeric" }),
  };
}

export default function DisponibilidadPage() {
  const [asesores, setAsesores] = useState<Advisor[]>([]);
  const [rows, setRows] = useState<AvailabilityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const days = useMemo(() => lastNDays(7), []);
  const hoy = days[days.length - 1];

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [users, avail] = await Promise.all([
        listAsesorUsers(),
        getAvailabilityDaily(days[0], days[days.length - 1]),
      ]);
      // Solo asesores reales (con login rol=asesor activo) — los admins no aparecen.
      const advisors = users
        .filter((u) => u.rol === "asesor" && u.activo && u.asesor_id && u.asesores)
        .map((u) => ({ id: u.asesor_id as string, nombre: u.asesores!.nombre }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
      setAsesores(advisors);
      setRows(avail);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mapa: asesor_id → fecha → minutos
  const grid = useMemo(() => {
    const m: Record<string, Record<string, number>> = {};
    for (const r of rows) {
      (m[r.asesor_id] ??= {})[r.fecha] = r.minutos;
    }
    return m;
  }, [rows]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#E4EEF0]">Disponibilidad de asesores</h1>
          <p className="text-sm text-[#94B3BB] mt-1">
            Horas que cada asesor estuvo <span className="text-emerald-400 font-medium">Disponible</span> por día (últimos 7 días, horario de Chicago)
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

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
          Error: {error}
        </div>
      )}

      {loading ? (
        <div className="h-48 rounded-2xl bg-[#1d9fa9]/5 animate-pulse" />
      ) : asesores.length === 0 ? (
        <div className="text-center py-16 text-[#6A8E98] text-sm">No hay asesores activos.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#1d9fa9]/15 bg-[#0F2229]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1d9fa9]/15">
                <th className="text-left px-4 py-3 text-xs text-[#6A8E98] font-semibold uppercase tracking-wider sticky left-0 bg-[#0F2229]">
                  Asesor
                </th>
                {days.map((f) => {
                  const c = colDate(f);
                  const esHoy = f === hoy;
                  return (
                    <th key={f} className={`px-3 py-3 text-center text-xs font-semibold ${esHoy ? "text-[#1d9fa9]" : "text-[#6A8E98]"}`}>
                      <div className="uppercase">{c.dow}</div>
                      <div className="font-normal text-[10px] mt-0.5">{c.dm}{esHoy ? " · hoy" : ""}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {asesores.map((a) => (
                <tr key={a.id} className="border-b border-[#1d9fa9]/10 last:border-0 hover:bg-[#1d9fa9]/5">
                  <td className="px-4 py-3 font-medium text-[#E4EEF0] whitespace-nowrap sticky left-0 bg-[#0F2229]">
                    {a.nombre}
                  </td>
                  {days.map((f) => {
                    const min = grid[a.id]?.[f] ?? 0;
                    const esHoy = f === hoy;
                    // Verde ≥2h, ámbar <2h, rojo 0
                    const cls = min === 0
                      ? "text-red-400/70"
                      : min < 120
                        ? "text-amber-400"
                        : "text-emerald-400";
                    return (
                      <td key={f} className={`px-3 py-3 text-center font-mono ${cls} ${esHoy ? "bg-[#1d9fa9]/5" : ""}`}>
                        {fmtHoras(min)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Leyenda */}
      <div className="flex items-center gap-5 text-xs text-[#6A8E98]">
        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-emerald-400" /> ≥ 2h</span>
        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-400" /> &lt; 2h</span>
        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-red-400/70" /> no se conectó</span>
      </div>
    </div>
  );
}
