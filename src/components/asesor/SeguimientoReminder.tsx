// SeguimientoReminder — pop-up toast shown ~5 min before a scheduled re-contact.
// Non-intrusive but impossible to miss. Renders outside the main CockpitPage layout.
import { useState } from "react";
import { X, Phone, Clock } from "lucide-react";

export interface SeguimientoReminderPayload {
  seguimiento_id: string;
  lead_id: string;
  nombre: string;
  programado_para: string;
  nota?: string | null;
}

interface Props {
  payload: SeguimientoReminderPayload;
  onClose: () => void;
  onVerLead: (lead_id: string) => void;
}

export default function SeguimientoReminder({ payload, onClose, onVerLead }: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const hora = new Date(payload.programado_para).toLocaleTimeString("es", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleVerLead = () => {
    onVerLead(payload.lead_id);
    setDismissed(true);
    onClose();
  };

  const handleClose = () => {
    setDismissed(true);
    onClose();
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9998] w-80 bg-[#0F2229] border-2 border-[#1d9fa9] rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      {/* Accent bar */}
      <div className="h-1 bg-gradient-to-r from-[#1d9fa9] via-emerald-400 to-[#1d9fa9]" />

      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#1d9fa9]/20 flex items-center justify-center flex-shrink-0 animate-pulse">
              <Clock className="w-4.5 h-4.5 text-[#1d9fa9]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#1d9fa9] uppercase tracking-wider">Recontacto en 5 min</p>
              <p className="text-xs text-[#6A8E98]">Programado para las {hora}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-[#6A8E98] hover:text-[#E4EEF0] hover:bg-[#1d9fa9]/10 transition-colors flex-shrink-0"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lead info */}
        <div>
          <p className="text-base font-bold text-[#E4EEF0]">
            📞 {payload.nombre}
          </p>
          {payload.nota && (
            <p className="text-xs text-[#94B3BB] italic mt-1 line-clamp-2">"{payload.nota}"</p>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={handleVerLead}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1d9fa9] hover:bg-[#1d9fa9]/80 text-white text-sm font-semibold transition-colors"
        >
          <Phone className="w-4 h-4" />
          Ver lead
        </button>
      </div>
    </div>
  );
}
