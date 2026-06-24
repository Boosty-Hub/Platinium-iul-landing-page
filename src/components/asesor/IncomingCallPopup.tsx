// IncomingCallPopup — full-screen impossible-to-miss modal for incoming calls.
// Ring tone generated via Web Audio API oscillator (no mp3 asset required).
import { useEffect, useRef, useState } from "react";
import { Phone, X, ExternalLink, Send } from "lucide-react";
import { submitCallNote } from "@/lib/asesorApi";

export interface IncomingCallPayload {
  attempt_id: string | null;
  kommo_subdominio: string | null;
  lead_id: string | null;
  kommo_lead_id: string | null;
  nombre: string | null;
  telefono: string | null;
  interes: string | null;
  edad: number | null;
  anio_nacimiento: number | null;
  ahorro_semanal: string | null;
  city: string | null;
  fuente: string | null;
  utm_source: string | null;
  ts: string;
  es_seguimiento?: boolean;
}

interface Props {
  payload: IncomingCallPayload;
  kommoSubdominio?: string | null;
  onClose: () => void;
  onVerHistorial?: (lead_id: string) => void;
}

// ── Imports for seguimiento badge ────────────────────────────────────────────
import { History } from "lucide-react";

// ── Web Audio ring generator ─────────────────────────────────────────────────
function startRing(): () => void {
  let ctx: AudioContext | null = null;
  let stopped = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  function beep() {
    if (stopped) return;
    try {
      if (!ctx) ctx = new AudioContext();
      // Si el navegador suspendió el audio (política de autoplay), reanudarlo.
      // Funciona porque el asesor ya interactuó con la página (tocó "Disponible").
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880; // A5 — distinct, loud-ish
      gain.gain.setValueAtTime(0.6, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch { /* AudioContext may be unavailable in some environments */ }
    if (!stopped) timeoutId = setTimeout(beep, 1200); // beep every 1.2 s
  }

  beep();

  return () => {
    stopped = true;
    if (timeoutId) clearTimeout(timeoutId);
    try { ctx?.close(); } catch { /* ignore */ }
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function IncomingCallPopup({ payload, kommoSubdominio, onClose, onVerHistorial }: Props) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const stopRingRef = useRef<(() => void) | null>(null);

  // Start ringing on mount, stop on unmount
  useEffect(() => {
    stopRingRef.current = startRing();
    return () => { stopRingRef.current?.(); };
  }, []);

  const handleClose = () => {
    stopRingRef.current?.();
    onClose();
  };

  const handleSaveNote = async () => {
    if (!payload.attempt_id || !note.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      await submitCallNote(payload.attempt_id, note.trim());
      setSaved(true);
      stopRingRef.current?.();
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // Compute edad from anio_nacimiento if edad not present
  const edad = payload.edad ?? (payload.anio_nacimiento ? new Date().getFullYear() - payload.anio_nacimiento : null);

  // Kommo link — el subdominio viene en el payload (broadcast del motor);
  // el prop queda como override opcional.
  const subdominio = payload.kommo_subdominio ?? kommoSubdominio ?? null;
  const kommoLink = payload.kommo_lead_id && subdominio
    ? `https://${subdominio}.kommo.com/leads/detail/${payload.kommo_lead_id}`
    : null;

  return (
    // Full-screen overlay — z-[9999] ensures it sits above everything including mobile top bar
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-[#0F2229] border-2 border-[#1d9fa9] rounded-2xl shadow-2xl overflow-hidden animate-pulse-border">
        {/* Animated top bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#1d9fa9] via-emerald-400 to-[#1d9fa9] animate-shimmer" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1d9fa9]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1d9fa9]/20 flex items-center justify-center animate-pulse">
              <Phone className="w-5 h-5 text-[#1d9fa9]" />
            </div>
            <div>
              <p className="text-xs text-[#6A8E98] uppercase tracking-wider font-semibold">Llamada entrante</p>
              <p className="text-[11px] text-[#94B3BB]">{new Date(payload.ts).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-[#94B3BB] hover:text-white hover:bg-[#1d9fa9]/10 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lead info */}
        <div className="px-6 pt-5 pb-4 space-y-4">
          {/* Name — BIG */}
          <div>
            {payload.es_seguimiento && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-2">
                <History className="w-3.5 h-3.5" />
                Recontacto programado
              </div>
            )}
            <p className="text-3xl font-bold text-[#E4EEF0] leading-tight">
              {payload.nombre ?? "Lead desconocido"}
            </p>
            <p className="text-xl text-[#1d9fa9] font-mono mt-1">
              {payload.telefono ?? "—"}
            </p>
          </div>

          {/* Lead details grid */}
          <div className="grid grid-cols-2 gap-3">
            <InfoRow label="Interés" value={payload.interes} />
            <InfoRow label="Edad" value={edad != null ? `${edad} años` : null} />
            <InfoRow label="Ahorro semanal" value={payload.ahorro_semanal} />
            <InfoRow label="Ciudad" value={payload.city} />
            <InfoRow label="Fuente" value={payload.fuente ?? payload.utm_source} />
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 space-y-3">
          {/* Kommo link */}
          {kommoLink && (
            <a
              href={kommoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#1d9fa9] hover:bg-[#1d9fa9]/80 text-white font-semibold text-sm transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir en Kommo
            </a>
          )}

          {/* Notes textarea */}
          <div className="space-y-2">
            <label className="text-xs text-[#6A8E98] uppercase tracking-wider font-semibold">
              Nota de llamada
            </label>
            <textarea
              className="w-full bg-[#0B1A1E] border border-[#1d9fa9]/30 rounded-xl px-3 py-2 text-sm text-[#E4EEF0] placeholder-[#6A8E98] resize-none focus:outline-none focus:border-[#1d9fa9]/60 transition-colors"
              rows={3}
              placeholder="Escribe una nota sobre esta llamada..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={saved}
            />
            {saveError && <p className="text-xs text-red-400">{saveError}</p>}
            {saved && <p className="text-xs text-emerald-400">Nota guardada en Kommo.</p>}
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleSaveNote}
              disabled={saving || saved || !note.trim() || !payload.attempt_id}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
            >
              <Send className="w-4 h-4" />
              {saving ? "Guardando..." : saved ? "Guardado" : "Guardar nota"}
            </button>
            {payload.es_seguimiento && onVerHistorial && payload.lead_id && (
              <button
                onClick={() => { stopRingRef.current?.(); onVerHistorial(payload.lead_id!); }}
                className="px-4 py-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 hover:bg-blue-500/25 text-sm font-medium transition-colors flex items-center gap-1.5"
              >
                <History className="w-4 h-4" />
                Ver historial
              </button>
            )}
            <button
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl border border-[#1d9fa9]/30 text-[#94B3BB] hover:text-white hover:border-[#1d9fa9]/60 text-sm font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="bg-[#0B1A1E] rounded-lg px-3 py-2">
      <p className="text-[10px] text-[#6A8E98] uppercase tracking-wider font-semibold mb-0.5">{label}</p>
      <p className="text-sm text-[#E4EEF0] font-medium truncate">{value}</p>
    </div>
  );
}
