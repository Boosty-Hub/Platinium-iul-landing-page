// MisLeadsPage — advisor's own call_queue rows (Slice 2).
// RLS already restricts to own asesor_id rows only.
import { useEffect, useState } from "react";
import { RefreshCw, Phone, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { getMyLeads } from "@/lib/asesorApi";
import type { MyLead } from "@/lib/asesorApi";

const ESTADO_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: "Pendiente", icon: Clock, color: "text-yellow-400" },
  scheduled: { label: "Programado", icon: Clock, color: "text-blue-400" },
  in_progress: { label: "En proceso", icon: Phone, color: "text-[#1d9fa9]" },
  contactado: { label: "Contactado", icon: CheckCircle, color: "text-emerald-400" },
  no_contactado: { label: "No contactado", icon: XCircle, color: "text-red-400" },
  failed: { label: "Fallido", icon: AlertCircle, color: "text-red-400" },
};

function EstadoBadge({ estado }: { estado: string }) {
  const cfg = ESTADO_CONFIG[estado] ?? { label: estado, icon: AlertCircle, color: "text-[#94B3BB]" };
  const Icon = cfg.icon;
  return (
    <span className={`flex items-center gap-1 text-xs font-semibold ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

export default function MisLeadsPage() {
  const [leads, setLeads] = useState<MyLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setLeads(await getMyLeads());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#E4EEF0]">Mis Leads</h1>
          <p className="text-sm text-[#94B3BB] mt-1">Leads asignados a tu cola de llamadas</p>
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

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
          Error cargando leads: {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-[#0F2229] border border-[#1d9fa9]/20 rounded-2xl overflow-hidden">
        {loading && leads.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-[#6A8E98] text-sm">
            Cargando leads...
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-2 text-center">
            <Phone className="w-10 h-10 text-[#1d9fa9]/40" />
            <p className="text-[#94B3BB] text-sm">No tienes leads asignados aún.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1d9fa9]/20 text-[10px] text-[#6A8E98] uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-semibold">Nombre</th>
                  <th className="text-left px-4 py-3 font-semibold">Teléfono</th>
                  <th className="text-left px-4 py-3 font-semibold">Interés</th>
                  <th className="text-left px-4 py-3 font-semibold">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold">Intentos</th>
                  <th className="text-left px-4 py-3 font-semibold">Próximo intento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1d9fa9]/10">
                {leads.map((row) => (
                  <tr key={row.id} className="hover:bg-[#1d9fa9]/5 transition-colors">
                    <td className="px-4 py-3 text-[#E4EEF0] font-medium">
                      {row.lead?.nombre ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[#94B3BB] font-mono">
                      {row.lead?.telefono ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[#94B3BB]">
                      {row.lead?.interes ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={row.estado} />
                    </td>
                    <td className="px-4 py-3 text-[#94B3BB]">
                      {row.client_attempts}
                    </td>
                    <td className="px-4 py-3 text-[#6A8E98] text-xs">
                      {row.scheduled_at
                        ? new Date(row.scheduled_at).toLocaleString("es", {
                            month: "short", day: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-[#6A8E98]">
        {leads.length} lead{leads.length !== 1 ? "s" : ""} en tu cola.
      </p>
    </div>
  );
}
