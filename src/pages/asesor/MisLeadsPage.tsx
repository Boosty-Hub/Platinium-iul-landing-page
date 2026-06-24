// MisLeadsPage — advisor's own call_queue rows with direct call + stage management.
// RLS already restricts to own asesor_id rows only.
import { useEffect, useState } from "react";
import {
  RefreshCw,
  Phone,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  PhoneCall,
  ChevronDown,
} from "lucide-react";
import {
  getMyLeads,
  callLead,
  updateLeadStage,
  getKommoStages,
} from "@/lib/asesorApi";
import type { MyLead, KommoStage } from "@/lib/asesorApi";

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
  const [stages, setStages] = useState<KommoStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [callingId, setCallingId] = useState<string | null>(null);
  const [stagingId, setStagingId] = useState<string | null>(null);
  const [stageDropdownOpen, setStageDropdownOpen] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const [leadsData, stagesData] = await Promise.all([
        getMyLeads(),
        getKommoStages().catch(() => [] as KommoStage[]), // Kommo may not be configured
      ]);
      setLeads(leadsData);
      setStages(stagesData);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCall = async (row: MyLead) => {
    const nombre = row.lead?.nombre ?? "este lead";
    const confirmed = window.confirm(
      `¿Llamar a ${nombre}? Tu teléfono sonará primero, luego el del cliente.`,
    );
    if (!confirmed) return;

    setCallingId(row.id);
    setError(null);
    setSuccessMsg(null);
    try {
      await callLead(row.lead_id);
      setSuccessMsg(`Llamando a ${nombre}...`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCallingId(null);
    }
  };

  const handleStageSelect = async (row: MyLead, stage: KommoStage) => {
    setStageDropdownOpen(null);
    setStagingId(row.id);
    setError(null);
    setSuccessMsg(null);
    try {
      await updateLeadStage(row.lead_id, stage.id);
      setSuccessMsg("Etapa actualizada");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setStagingId(null);
    }
  };

  const toggleDropdown = (rowId: string) => {
    setStageDropdownOpen((prev) => (prev === rowId ? null : rowId));
  };

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

      {/* Success banner */}
      {successMsg && (
        <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl px-4 py-3 text-sm text-emerald-400">
          {successMsg}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
          {error}
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
                  <th className="text-left px-4 py-3 font-semibold">Acciones</th>
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
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* Call button */}
                        <button
                          onClick={() => handleCall(row)}
                          disabled={callingId === row.id}
                          title="Llamar"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1d9fa9]/10 border border-[#1d9fa9]/30 text-[#1d9fa9] text-xs font-medium hover:bg-[#1d9fa9]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {callingId === row.id ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Llamando...
                            </>
                          ) : (
                            <>
                              <PhoneCall className="w-3.5 h-3.5" />
                              Llamar
                            </>
                          )}
                        </button>

                        {/* Stage dropdown — hidden if Kommo not configured */}
                        {stages.length > 0 && (
                          <div className="relative">
                            <button
                              onClick={() => toggleDropdown(row.id)}
                              onBlur={() =>
                                setTimeout(() => setStageDropdownOpen(null), 150)
                              }
                              disabled={stagingId === row.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F2229] border border-[#1d9fa9]/30 text-[#94B3BB] text-xs font-medium hover:border-[#1d9fa9]/60 hover:text-[#E4EEF0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {stagingId === row.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  Etapa
                                  <ChevronDown className="w-3 h-3" />
                                </>
                              )}
                            </button>

                            {stageDropdownOpen === row.id && (
                              <div className="absolute z-50 top-full left-0 mt-1 w-48 bg-[#0B1A1E] border border-[#1d9fa9]/30 rounded-xl shadow-xl py-1 max-h-48 overflow-y-auto">
                                {stages.map((stage) => (
                                  <button
                                    key={stage.id}
                                    onMouseDown={() => handleStageSelect(row, stage)}
                                    className="w-full text-left px-3 py-2 text-xs text-[#94B3BB] hover:bg-[#1d9fa9]/10 hover:text-[#E4EEF0] transition-colors"
                                  >
                                    {stage.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
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
