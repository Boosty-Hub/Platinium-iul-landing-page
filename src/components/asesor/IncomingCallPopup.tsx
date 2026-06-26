// IncomingCallPopup — full-screen impossible-to-miss modal for incoming calls.
// Ring tone generated via Web Audio API oscillator (no mp3 asset required).
import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, X, ExternalLink, Send, FileText, Check } from "lucide-react";
import { submitCallNote, acceptLead, updateLead, sendCotizacion } from "@/lib/asesorApi";

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
  genero: string | null;
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
  /** Sonido de llamada configurado por el admin (tono + volumen). */
  sonido?: { tono?: RingTone; volumen?: number };
}

// ── Imports for seguimiento badge ────────────────────────────────────────────
import { History } from "lucide-react";

// ── Web Audio ring generator (configurable + fuerte) ─────────────────────────
export type RingTone = "clasico" | "urgente" | "campana" | "sirena";

// Genera el tono de llamada vía Web Audio (sin assets mp3). Onda cuadrada =
// más penetrante/fuerte. `volumen` 0..1. Devuelve una función para detenerlo.
export function startRing(tono: RingTone = "urgente", volumen = 0.9): () => void {
  let ctx: AudioContext | null = null;
  let stopped = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const vol = Math.max(0, Math.min(1, volumen));

  function tone(freq: number, start: number, dur: number, peak = 1) {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square"; // más "duro" que sine
    osc.frequency.value = freq;
    const t = ctx.currentTime + start;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol * peak), t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  // Cada preset suena un ciclo y devuelve cuántos segundos hasta repetir.
  function cycle(): number {
    if (tono === "clasico") { tone(880, 0, 0.4); return 1.2; }
    if (tono === "campana") { tone(660, 0, 0.7); tone(990, 0, 0.7, 0.5); return 1.5; }
    if (tono === "sirena") { tone(700, 0, 0.4); tone(1050, 0.4, 0.4); return 1.0; }
    // urgente (default): triple beep rápido y fuerte
    tone(950, 0, 0.18); tone(950, 0.26, 0.18); tone(950, 0.52, 0.18);
    return 1.15;
  }

  function ring() {
    if (stopped) return;
    try {
      if (!ctx) ctx = new AudioContext();
      // Si el navegador suspendió el audio (política de autoplay), reanudarlo.
      // Funciona porque el asesor ya interactuó con la página (tocó "Disponible").
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const period = cycle();
      if (!stopped) timeoutId = setTimeout(ring, period * 1000);
    } catch { /* AudioContext may be unavailable in some environments */ }
  }

  ring();

  return () => {
    stopped = true;
    if (timeoutId) clearTimeout(timeoutId);
    try { ctx?.close(); } catch { /* ignore */ }
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function IncomingCallPopup({ payload, kommoSubdominio, onClose, onVerHistorial, sonido }: Props) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [inCall, setInCall] = useState(false);
  const stopRingRef = useRef<(() => void) | null>(null);

  // ── Cotización en llamada (editar datos + enviar sin fricción) ──
  const edadInicial = payload.edad ?? (payload.anio_nacimiento ? new Date().getFullYear() - payload.anio_nacimiento : null);
  const [cotEdad, setCotEdad] = useState<string>(edadInicial != null ? String(edadInicial) : "");
  const [cotGenero, setCotGenero] = useState<string>(payload.genero ?? "");
  const [cotAhorro, setCotAhorro] = useState<string>(payload.ahorro_semanal ?? "");
  const [cotState, setCotState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [cotMsg, setCotMsg] = useState<string>("");

  const enviarCotizacion = async () => {
    if (!payload.lead_id) return;
    setCotState("sending");
    setCotMsg("");
    try {
      // Guardar correcciones de datos si las hay (edad / género / ahorro).
      const fields: { edad?: number; genero?: string; ahorro_semanal?: number } = {};
      const edadN = parseInt(cotEdad, 10);
      if (Number.isFinite(edadN) && edadN >= 18) fields.edad = edadN;
      if (cotGenero) fields.genero = cotGenero;
      const ahN = parseInt(cotAhorro, 10);
      if (Number.isFinite(ahN) && ahN >= 0) fields.ahorro_semanal = ahN;
      if (Object.keys(fields).length) await updateLead(payload.lead_id, fields);
      // Enviar la cotización ya con la data actualizada.
      const r = await sendCotizacion(payload.lead_id);
      setCotState("sent");
      setCotMsg(`Cotización de $${r.monto.toLocaleString()} enviada a ${r.to}`);
    } catch (e) {
      setCotState("error");
      setCotMsg((e as Error).message);
    }
  };

  // Start ringing on mount, stop on unmount
  useEffect(() => {
    stopRingRef.current = startRing(sonido?.tono, sonido?.volumen);
    return () => { stopRingRef.current?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    stopRingRef.current?.();
    onClose();
  };

  // Contestar (modelo click-to-call): al aceptar el lead, el softphone del asesor
  // MARCA al cliente —mismo mecanismo que el "Llamar" manual que ya funciona— y le
  // avisamos al motor que aceptamos (deja de ofrecer el lead a otros asesores).
  const answerCall = async () => {
    const tel = payload.telefono;
    if (tel) {
      const frame = document.querySelector("#rc-widget-adapter-frame") as HTMLIFrameElement | null;
      frame?.contentWindow?.postMessage(
        { type: "rc-adapter-new-call", phoneNumber: tel, toCall: true },
        "https://apps.ringcentral.com",
      );
    }
    stopRingRef.current?.(); // el softphone toma el audio; cortamos nuestro tono
    setInCall(true); // el pop-up pasa a panel flotante (deja libre el softphone)
    if (payload.attempt_id) {
      try { await acceptLead(payload.attempt_id); } catch { /* el softphone ya marcó; no bloqueamos */ }
    }
  };

  // Colgar desde el panel (sin tener que buscar el softphone): le pedimos al widget
  // de RC que cuelgue. Al colgar (rc-call-end-notify) el provider cierra el panel y
  // abre "¿Cómo fue la llamada?".
  const hangUp = () => {
    const frame = document.querySelector("#rc-widget-adapter-frame") as HTMLIFrameElement | null;
    frame?.contentWindow?.postMessage(
      { type: "rc-adapter-control-call", callAction: "hangup" },
      "https://apps.ringcentral.com",
    );
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
    // Entrante → modal a pantalla completa. En llamada → panel flotante arriba a la
    // izquierda (NO tapa el softphone abajo a la derecha, así se puede colgar).
    <div className={inCall
      ? "fixed top-4 left-4 z-[9998] w-[88vw] max-w-xs"
      : "fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"}>
      <div className={`relative w-full ${inCall ? "max-w-xs" : "max-w-lg"} bg-[#0F2229] border-2 ${inCall ? "border-emerald-500" : "border-[#1d9fa9]"} rounded-2xl shadow-2xl overflow-hidden ${inCall ? "" : "animate-pulse-border"}`}>
        {/* Animated top bar */}
        <div className={`h-1.5 bg-gradient-to-r ${inCall ? "from-emerald-500 via-emerald-400 to-emerald-500" : "from-[#1d9fa9] via-emerald-400 to-[#1d9fa9] animate-shimmer"}`} />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1d9fa9]/30">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${inCall ? "bg-emerald-500/20" : "bg-[#1d9fa9]/20"} flex items-center justify-center animate-pulse`}>
              <Phone className={`w-5 h-5 ${inCall ? "text-emerald-400" : "text-[#1d9fa9]"}`} />
            </div>
            <div>
              <p className="text-xs text-[#6A8E98] uppercase tracking-wider font-semibold">
                {inCall ? "En llamada" : "Llamada entrante"}
              </p>
              <p className="text-[11px] text-[#94B3BB]">
                {inCall ? "Hablando con el lead" : new Date(payload.ts).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
          {!inCall && (
            <button
              onClick={handleClose}
              className="p-2 rounded-lg text-[#94B3BB] hover:text-white hover:bg-[#1d9fa9]/10 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
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
            <p className={`${inCall ? "text-2xl" : "text-3xl"} font-bold text-[#E4EEF0] leading-tight`}>
              {payload.nombre ?? "Lead desconocido"}
            </p>
            <p className={`${inCall ? "text-lg" : "text-xl"} text-[#1d9fa9] font-mono mt-1`}>
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
          {/* Contestar (entrante) → Colgar (en llamada) */}
          {inCall ? (
            <button
              onClick={hangUp}
              className="flex items-center justify-center gap-2.5 w-full py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-base transition-colors shadow-lg shadow-red-900/40"
            >
              <PhoneOff className="w-5 h-5" />
              Colgar
            </button>
          ) : (
            <button
              onClick={answerCall}
              className="flex items-center justify-center gap-2.5 w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base transition-colors shadow-lg shadow-emerald-900/40 animate-pulse"
            >
              <Phone className="w-5 h-5" />
              Contestar
            </button>
          )}

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

          {/* Datos + cotización en llamada (sin fricción) */}
          {inCall && payload.lead_id && (
            <div className="space-y-2 rounded-xl border border-[#1d9fa9]/25 bg-[#0B1A1E]/60 p-3">
              <div className="flex items-center gap-1.5 text-xs text-[#6A8E98] uppercase tracking-wider font-semibold">
                <FileText className="w-3.5 h-3.5 text-[#1d9fa9]" /> Datos y cotización
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#6A8E98]">Edad</label>
                  <input
                    type="number" min={18} max={100} value={cotEdad}
                    onChange={(e) => setCotEdad(e.target.value)} disabled={cotState === "sent"}
                    className="w-full bg-[#0F2229] border border-[#1d9fa9]/30 rounded-lg px-2 py-1.5 text-sm text-[#E4EEF0] focus:outline-none focus:border-[#1d9fa9]/60 disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-[#6A8E98]">Género</label>
                  <select
                    value={cotGenero} onChange={(e) => setCotGenero(e.target.value)} disabled={cotState === "sent"}
                    className="w-full bg-[#0F2229] border border-[#1d9fa9]/30 rounded-lg px-2 py-1.5 text-sm text-[#E4EEF0] focus:outline-none focus:border-[#1d9fa9]/60 disabled:opacity-50"
                  >
                    <option value="">—</option>
                    <option value="Masculino">M</option>
                    <option value="Femenino">F</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-[#6A8E98]">Ahorro sem.</label>
                  <input
                    type="number" min={0} value={cotAhorro}
                    onChange={(e) => setCotAhorro(e.target.value)} disabled={cotState === "sent"}
                    className="w-full bg-[#0F2229] border border-[#1d9fa9]/30 rounded-lg px-2 py-1.5 text-sm text-[#E4EEF0] focus:outline-none focus:border-[#1d9fa9]/60 disabled:opacity-50"
                  />
                </div>
              </div>
              <button
                onClick={enviarCotizacion}
                disabled={cotState === "sending" || cotState === "sent"}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#1d9fa9] hover:bg-[#1d9fa9]/80 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
              >
                {cotState === "sent" ? (<><Check className="w-4 h-4" /> Cotización enviada</>) : (<><FileText className="w-4 h-4" /> {cotState === "sending" ? "Enviando…" : "Enviar cotización"}</>)}
              </button>
              {cotMsg && <p className={`text-xs ${cotState === "error" ? "text-red-400" : "text-emerald-400"}`}>{cotMsg}</p>}
            </div>
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
            {!inCall && (
              <button
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl border border-[#1d9fa9]/30 text-[#94B3BB] hover:text-white hover:border-[#1d9fa9]/60 text-sm font-medium transition-colors"
              >
                Cerrar
              </button>
            )}
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
