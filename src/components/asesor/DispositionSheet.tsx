// DispositionSheet — drawer to record a call result + optionally schedule a follow-up.
// Big tap targets, friendly copy, no technical jargon. Teal theme.
import { useState } from "react";
import { X, Phone, Clock, Calendar, ThumbsUp, ThumbsDown, CheckCircle2, Send, XCircle, Hash, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { setDisposicion } from "@/lib/asesorApi";
import type { Disposicion } from "@/lib/asesorApi";

// ── Disposition config ────────────────────────────────────────────────────────
interface DisposicionConfig {
  key: Disposicion;
  label: string;
  icon: React.ReactNode;
  color: string;      // text color
  bg: string;         // background + border classes
  schedulable: boolean;
}

const DISPOSICIONES: DisposicionConfig[] = [
  {
    key: "no_contesto",
    label: "No contestó",
    icon: <Phone className="w-5 h-5" />,
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20",
    schedulable: false,
  },
  {
    key: "interesado",
    label: "Interesado",
    icon: <ThumbsUp className="w-5 h-5" />,
    color: "text-[#1d9fa9]",
    bg: "bg-[#1d9fa9]/10 border-[#1d9fa9]/30 hover:bg-[#1d9fa9]/20",
    schedulable: false,
  },
  {
    key: "llamar_despues",
    label: "Llamar después",
    icon: <Clock className="w-5 h-5" />,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20",
    schedulable: true,
  },
  {
    key: "cotizacion_enviada",
    label: "Cotización enviada",
    icon: <Send className="w-5 h-5" />,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20",
    schedulable: true,
  },
  {
    key: "cita_agendada",
    label: "Cita agendada",
    icon: <Calendar className="w-5 h-5" />,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20",
    schedulable: true,
  },
  {
    key: "no_interesado",
    label: "No interesado",
    icon: <ThumbsDown className="w-5 h-5" />,
    color: "text-[#6A8E98]",
    bg: "bg-[#6A8E98]/10 border-[#6A8E98]/30 hover:bg-[#6A8E98]/20",
    schedulable: false,
  },
  {
    key: "ganado",
    label: "Ganado ✓",
    icon: <CheckCircle2 className="w-5 h-5" />,
    color: "text-emerald-400",
    bg: "bg-emerald-500/15 border-emerald-500/40 hover:bg-emerald-500/25",
    schedulable: false,
  },
  {
    key: "numero_equivocado",
    label: "Número equivocado",
    icon: <XCircle className="w-5 h-5" />,
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/30 hover:bg-red-500/20",
    schedulable: false,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function defaultSchedule(): string {
  // Default: tomorrow at 10:00 local time
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  // Format as "YYYY-MM-DDTHH:MM" for datetime-local input
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  leadId: string;
  nombre: string;
  onClose: () => void;
  onSuccess: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DispositionSheet({ leadId, nombre, onClose, onSuccess }: Props) {
  const [selected, setSelected] = useState<DisposicionConfig | null>(null);
  const [nota, setNota] = useState("");
  const [programarPara, setProgramarPara] = useState(defaultSchedule());
  const [saving, setSaving] = useState(false);

  const cfg = selected;
  const showScheduler = cfg?.schedulable ?? false;

  const handleSelect = (d: DisposicionConfig) => {
    setSelected(d);
    // Reset scheduler to default when a schedulable disposition is selected
    if (d.schedulable) setProgramarPara(defaultSchedule());
  };

  const handleSave = async () => {
    if (!cfg) return;
    setSaving(true);
    try {
      const opts: { nota?: string; programar_para?: string } = {};
      if (nota.trim()) opts.nota = nota.trim();
      if (showScheduler && programarPara) {
        // Convert datetime-local (local time) to ISO string
        opts.programar_para = new Date(programarPara).toISOString();
      }
      await setDisposicion(leadId, cfg.key, opts);
      const msg = showScheduler
        ? `Resultado guardado. Te avisaremos 5 min antes del recontacto.`
        : `Resultado guardado para ${nombre}.`;
      toast.success(msg);
      onSuccess();
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Sheet */}
      <div className="relative w-full sm:max-w-lg bg-[#0F2229] border border-[#1d9fa9]/30 sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#1d9fa9]/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1d9fa9]/20 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-[#E4EEF0]">¿Cómo fue la llamada?</h2>
            <p className="text-xs text-[#6A8E98] mt-0.5">con <span className="text-[#94B3BB] font-medium">{nombre}</span></p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#6A8E98] hover:text-[#E4EEF0] hover:bg-[#1d9fa9]/10 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Disposition grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {DISPOSICIONES.map((d) => {
              const isSelected = selected?.key === d.key;
              return (
                <button
                  key={d.key}
                  onClick={() => handleSelect(d)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all ${d.bg} ${d.color} ${
                    isSelected
                      ? "ring-2 ring-offset-2 ring-offset-[#0F2229] ring-[#1d9fa9] scale-[1.02]"
                      : ""
                  }`}
                >
                  <span className="flex-shrink-0">{d.icon}</span>
                  <span className="text-sm font-medium leading-tight">{d.label}</span>
                  {isSelected && (
                    <ChevronRight className="w-4 h-4 ml-auto flex-shrink-0 opacity-60" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Scheduler — only for schedulable dispositions */}
          {showScheduler && (
            <div className="bg-[#0B1A1E] rounded-xl p-4 space-y-2 border border-[#1d9fa9]/20 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-[#1d9fa9]">
                <Calendar className="w-4 h-4" />
                <p className="text-sm font-semibold">¿Cuándo lo volvés a llamar?</p>
              </div>
              <input
                type="datetime-local"
                value={programarPara}
                onChange={(e) => setProgramarPara(e.target.value)}
                className="w-full bg-[#0F2229] border border-[#1d9fa9]/30 rounded-lg px-3 py-2 text-sm text-[#E4EEF0] focus:outline-none focus:border-[#1d9fa9]/60 transition-colors [color-scheme:dark]"
              />
              <p className="text-xs text-[#6A8E98]">
                Te avisaremos 5 minutos antes para que estés listo.
              </p>
            </div>
          )}

          {/* Optional note */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Hash className="w-3.5 h-3.5 text-[#6A8E98]" />
              <label className="text-xs text-[#6A8E98] font-medium uppercase tracking-wider">
                Nota (opcional)
              </label>
            </div>
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="¿Algo importante que recordar sobre esta conversación?"
              rows={3}
              className="w-full bg-[#0B1A1E] border border-[#1d9fa9]/20 rounded-xl px-3 py-2 text-sm text-[#E4EEF0] placeholder:text-[#6A8E98] resize-none focus:outline-none focus:border-[#1d9fa9]/50 transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-[#1d9fa9]/20 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#1d9fa9]/20 text-[#94B3BB] hover:text-[#E4EEF0] hover:border-[#1d9fa9]/40 text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!selected || saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1d9fa9] hover:bg-[#1d9fa9]/80 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
          >
            {saving ? "Guardando…" : "Guardar resultado"}
          </button>
        </div>
      </div>
    </div>
  );
}
