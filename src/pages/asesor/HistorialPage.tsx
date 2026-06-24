// HistorialPage — advisor's own call history (Slice 2 + Slice 3).
// Slice 3: "Reproducir" button on attempts with recording_storage_path.
import { useEffect, useState } from "react";
import { RefreshCw, CheckCircle, XCircle, Voicemail, AlertCircle, Clock, Play, X } from "lucide-react";
import { getMyHistory, getMyRecordingUrl } from "@/lib/asesorApi";
import type { MyCallAttempt } from "@/lib/asesorApi";

const OUTCOME_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  contactado: { label: "Contactado", icon: CheckCircle, color: "text-emerald-400" },
  advisor_no_answer: { label: "Asesor no contestó", icon: XCircle, color: "text-orange-400" },
  client_no_answer: { label: "Cliente no contestó", icon: XCircle, color: "text-yellow-400" },
  voicemail: { label: "Voicemail", icon: Voicemail, color: "text-blue-400" },
  failed: { label: "Error", icon: AlertCircle, color: "text-red-400" },
  cancelled: { label: "Cancelado", icon: XCircle, color: "text-[#94B3BB]" },
};

function OutcomeBadge({ outcome, estado }: { outcome: string | null; estado: string }) {
  const key = outcome ?? "";
  const cfg = OUTCOME_CONFIG[key] ?? { label: estado, icon: Clock, color: "text-[#6A8E98]" };
  const Icon = cfg.icon;
  return (
    <span className={`flex items-center gap-1 text-xs font-semibold ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function fmtSec(sec: number | null): string {
  if (sec == null) return "—";
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

// ── Recording player modal ────────────────────────────────────────────────────
interface RecordingModalProps {
  attemptId: string;
  onClose: () => void;
}

function RecordingModal({ attemptId, onClose }: RecordingModalProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getMyRecordingUrl(attemptId)
      .then((u) => { if (active) { setUrl(u); setLoading(false); } })
      .catch((e) => { if (active) { setError((e as Error).message); setLoading(false); } });
    return () => { active = false; };
  }, [attemptId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0F2229] border border-[#1d9fa9]/30 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#E4EEF0]">Grabación de llamada</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94B3BB] hover:text-white hover:bg-[#1d9fa9]/10 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading && (
          <p className="text-sm text-[#6A8E98] text-center py-4">Cargando grabación...</p>
        )}
        {error && (
          <p className="text-sm text-red-400 text-center py-4">
            Error: {error}
          </p>
        )}
        {url && (
          <audio
            controls
            autoPlay={false}
            src={url}
            className="w-full rounded-lg"
            style={{ colorScheme: "dark" }}
          />
        )}
        <p className="text-[11px] text-[#6A8E98] text-center">
          El enlace expira en 5 minutos. Descarga el audio si necesitas guardarlo.
        </p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HistorialPage() {
  const [history, setHistory] = useState<MyCallAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingAttemptId, setPlayingAttemptId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setHistory(await getMyHistory());
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
          <h1 className="text-2xl font-bold text-[#E4EEF0]">Historial de Llamadas</h1>
          <p className="text-sm text-[#94B3BB] mt-1">Tus intentos de llamada y resultados</p>
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
          Error cargando historial: {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-[#0F2229] border border-[#1d9fa9]/20 rounded-2xl overflow-hidden">
        {loading && history.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-[#6A8E98] text-sm">
            Cargando historial...
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-2 text-center">
            <Clock className="w-10 h-10 text-[#1d9fa9]/40" />
            <p className="text-[#94B3BB] text-sm">Aún no tienes llamadas registradas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1d9fa9]/20 text-[10px] text-[#6A8E98] uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-semibold">Fecha</th>
                  <th className="text-left px-4 py-3 font-semibold">Lead</th>
                  <th className="text-left px-4 py-3 font-semibold">Resultado</th>
                  <th className="text-left px-4 py-3 font-semibold">T. timbre</th>
                  <th className="text-left px-4 py-3 font-semibold">T. conversación</th>
                  <th className="text-left px-4 py-3 font-semibold">Nota</th>
                  <th className="text-left px-4 py-3 font-semibold">Grabación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1d9fa9]/10">
                {history.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-[#1d9fa9]/5 transition-colors">
                    <td className="px-4 py-3 text-[#6A8E98] text-xs whitespace-nowrap">
                      {attempt.inicio_at
                        ? new Date(attempt.inicio_at).toLocaleString("es", {
                            month: "short", day: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[#E4EEF0] font-medium">
                        {attempt.lead?.nombre ?? "—"}
                      </div>
                      <div className="text-[#6A8E98] text-xs font-mono">
                        {attempt.lead?.telefono ?? ""}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <OutcomeBadge outcome={attempt.outcome} estado={attempt.estado} />
                    </td>
                    <td className="px-4 py-3 text-[#94B3BB] text-xs font-mono">
                      {fmtSec(attempt.ring_time_sec)}
                    </td>
                    <td className="px-4 py-3 text-[#94B3BB] text-xs font-mono">
                      {fmtSec(attempt.talk_time_sec)}
                    </td>
                    <td className="px-4 py-3">
                      {attempt.notas ? (
                        <span
                          className="text-xs text-[#94B3BB] max-w-[160px] block truncate"
                          title={attempt.notas}
                        >
                          {attempt.notas}
                        </span>
                      ) : (
                        <span className="text-xs text-[#6A8E98]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {attempt.recording_storage_path ? (
                        <button
                          onClick={() => setPlayingAttemptId(attempt.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1d9fa9]/15 border border-[#1d9fa9]/30 text-[#1d9fa9] text-xs font-medium hover:bg-[#1d9fa9]/25 transition-colors"
                          title="Reproducir grabación"
                        >
                          <Play className="w-3 h-3" />
                          Reproducir
                        </button>
                      ) : (
                        <span className="text-xs text-[#6A8E98]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-[#6A8E98]">
        {history.length} intento{history.length !== 1 ? "s" : ""} (últimos 200).
      </p>

      {/* Recording player modal */}
      {playingAttemptId && (
        <RecordingModal
          attemptId={playingAttemptId}
          onClose={() => setPlayingAttemptId(null)}
        />
      )}
    </div>
  );
}
