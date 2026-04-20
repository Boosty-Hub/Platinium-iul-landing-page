import { useEffect } from "react";

interface Lead {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  city?: string | null;
  region?: string | null;
  interes?: string | null;
}

interface LeadAlertModalProps {
  lead: Lead | null;
  onClose: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
  audioEnabled: boolean;
}

const KOMMO_URL = "https://agentplatiniuminsurancecom.kommo.com/leads/pipeline/";

// Web Audio API fallback siren
function playSiren(): () => void {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "square";
  gain.gain.value = 0.25;

  let stopped = false;
  let t = ctx.currentTime;
  for (let i = 0; i < 60; i++) {
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.setValueAtTime(440, t + 0.25);
    t += 0.5;
  }
  osc.start();
  return () => {
    if (stopped) return;
    stopped = true;
    try { osc.stop(); ctx.close(); } catch {}
  };
}

export function LeadAlertModal({ lead, onClose, audioRef, audioEnabled }: LeadAlertModalProps) {
  useEffect(() => {
    if (!lead || !audioEnabled) return;
    let stopSiren: (() => void) | null = null;
    const audio = audioRef.current;

    if (audio) {
      audio.currentTime = 0;
      audio.volume = 1;
      audio.loop = true;
      audio.play().catch(() => {
        // Fallback to Web Audio siren
        stopSiren = playSiren();
      });
    } else {
      stopSiren = playSiren();
    }

    return () => {
      if (audio) { audio.pause(); audio.currentTime = 0; }
      if (stopSiren) stopSiren();
    };
  }, [lead, audioEnabled, audioRef]);

  if (!lead) return null;

  const handleKommo = () => {
    window.open(KOMMO_URL, "_blank", "noopener");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg mx-4 rounded-2xl bg-gradient-to-br from-[#0F2229] to-[#0B1A1E] border-2 border-[#1d9fa9] shadow-[0_0_60px_rgba(29,159,169,0.6)] p-8 animate-in zoom-in-95 duration-300">
        <div className="absolute -inset-1 rounded-2xl border-2 border-[#1d9fa9] animate-pulse pointer-events-none" />

        <div className="text-center space-y-6 relative">
          <div className="text-6xl animate-bounce">🚨</div>
          <h2 className="text-3xl font-bold text-white leading-tight">
            ¡Acaba de llegar un lead!
          </h2>
          <p className="text-[#94B3BB] text-lg">Atenderlo ahora.</p>

          <div className="bg-black/40 rounded-xl p-4 text-left space-y-2 border border-[#1d9fa9]/30">
            <div className="text-white"><span className="text-[#94B3BB] text-sm">Nombre:</span> <strong>{lead.nombre}</strong></div>
            <div className="text-white"><span className="text-[#94B3BB] text-sm">Teléfono:</span> <strong>{lead.telefono}</strong></div>
            <div className="text-white"><span className="text-[#94B3BB] text-sm">Email:</span> <strong>{lead.email}</strong></div>
            {lead.city && (
              <div className="text-white"><span className="text-[#94B3BB] text-sm">Ciudad:</span> <strong>{lead.city}{lead.region ? `, ${lead.region}` : ""}</strong></div>
            )}
            {lead.interes && (
              <div className="text-white"><span className="text-[#94B3BB] text-sm">Interés:</span> {lead.interes}</div>
            )}
          </div>

          <button
            onClick={handleKommo}
            className="w-full py-5 px-6 rounded-xl bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white font-bold text-xl shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all"
          >
            Ver en Kommo →
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 text-[#94B3BB] hover:text-white text-sm transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
