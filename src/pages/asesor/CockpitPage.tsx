// CockpitPage — Slice 2 (presence, heartbeat, Realtime) + Slice 3 (RC Embeddable).
// Slice 3: RC Embeddable softphone injected via useEffect when VITE_RC_CLIENT_ID is set.
// Graceful gating: if clientId is missing, renders a friendly config card instead.
import { useEffect, useRef, useState } from "react";
import { Radio, WifiOff, PhoneOff, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentAsesorId, updatePresence } from "@/lib/asesorApi";
import IncomingCallPopup from "@/components/asesor/IncomingCallPopup";
import type { IncomingCallPayload } from "@/components/asesor/IncomingCallPopup";

const HEARTBEAT_INTERVAL_MS = 30_000;
const RC_CLIENT_ID = import.meta.env.VITE_RC_CLIENT_ID as string | undefined;
const RC_ADAPTER_SCRIPT = "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.js";

export default function CockpitPage() {
  const [asesorId, setAsesorId] = useState<string | null>(null);
  const [disponible, setDisponible] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCallPayload | null>(null);
  const [presenceError, setPresenceError] = useState<string | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Init: resolve asesor ID and set initial presence ──────────────────────
  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const id = await getCurrentAsesorId();
        if (!active || !id) return;
        setAsesorId(id);
        // Mark as available on mount (satisfies autoplay policy for ring audio)
        await updatePresence(true);
        setDisponible(true);
      } catch (e) {
        console.error("cockpit init:", e);
      }
    }
    init();
    return () => { active = false; };
  }, []);

  // ── Heartbeat: send presence every 30 s while mounted ────────────────────
  useEffect(() => {
    if (!asesorId) return;
    heartbeatRef.current = setInterval(async () => {
      try {
        await updatePresence(disponible);
      } catch (e) {
        console.error("presence heartbeat:", e);
      }
    }, HEARTBEAT_INTERVAL_MS);
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [asesorId, disponible]);

  // ── Realtime: subscribe to incoming_call broadcasts ───────────────────────
  useEffect(() => {
    if (!asesorId) return;

    const channel = supabase.channel(`advisor:${asesorId}`, {
      config: { broadcast: { self: false } },
    });

    channel.on("broadcast", { event: "incoming_call" }, ({ payload }) => {
      setIncomingCall(payload as IncomingCallPayload);
    });

    channel.subscribe((status) => {
      if (status === "CHANNEL_ERROR") {
        console.error("Realtime channel error for advisor:", asesorId);
      }
    });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [asesorId]);

  // ── RC Embeddable: inject adapter script once (Slice 3) ───────────────────
  // Only injected when VITE_RC_CLIENT_ID is non-empty.
  // Script appended to body once; RC widget renders as an iframe overlay.
  useEffect(() => {
    if (!RC_CLIENT_ID) return;
    if (document.querySelector(`script[data-rc-embeddable]`)) return; // already injected

    const script = document.createElement("script");
    script.src = `${RC_ADAPTER_SCRIPT}?clientId=${encodeURIComponent(RC_CLIENT_ID)}&appServer=https://platform.ringcentral.com`;
    script.async = true;
    script.setAttribute("data-rc-embeddable", "true");
    document.body.appendChild(script);

    return () => {
      // Do NOT remove on unmount — RC Embeddable manages its own lifecycle
    };
  }, []); // run once

  // ── Toggle availability ───────────────────────────────────────────────────
  const handleToggle = async () => {
    const next = !disponible;
    setToggling(true);
    setPresenceError(null);
    try {
      await updatePresence(next);
      setDisponible(next);
    } catch (e) {
      setPresenceError((e as Error).message);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#E4EEF0]">Cockpit</h1>
        <p className="text-sm text-[#94B3BB] mt-1">Panel principal de llamadas</p>
      </div>

      {/* Presence toggle card */}
      <div className="bg-[#0F2229] border border-[#1d9fa9]/20 rounded-2xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#E4EEF0]">Estado de disponibilidad</p>
            <p className="text-xs text-[#6A8E98]">
              {disponible
                ? "Estás disponible — el sistema puede asignarte llamadas."
                : "No disponible — no recibirás llamadas entrantes."}
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={toggling || !asesorId}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              disponible
                ? "bg-[#1d9fa9] hover:bg-[#1d9fa9]/80 text-white"
                : "bg-[#0B1A1E] border border-[#1d9fa9]/40 text-[#94B3BB] hover:border-[#1d9fa9]/70 hover:text-[#E4EEF0]"
            }`}
          >
            {disponible ? (
              <><Radio className="w-4 h-4 animate-pulse" /> Disponible</>
            ) : (
              <><WifiOff className="w-4 h-4" /> No disponible</>
            )}
          </button>
        </div>
        {presenceError && (
          <p className="mt-3 text-xs text-red-400">Error: {presenceError}</p>
        )}
        {/* Heartbeat indicator */}
        <div className="mt-4 flex items-center gap-2">
          <span className={`inline-block w-2 h-2 rounded-full ${asesorId ? "bg-emerald-400 animate-pulse" : "bg-[#6A8E98]"}`} />
          <span className="text-[11px] text-[#6A8E98]">
            {asesorId ? "Presencia activa (heartbeat cada 30 s)" : "Conectando..."}
          </span>
        </div>
      </div>

      {/* Realtime status */}
      <div className="bg-[#0F2229] border border-[#1d9fa9]/20 rounded-2xl p-6">
        <p className="text-sm font-semibold text-[#E4EEF0] mb-1">Canal de llamadas en tiempo real</p>
        <p className="text-xs text-[#6A8E98]">
          {asesorId
            ? `Suscrito a advisor:${asesorId.slice(0, 8)}… — esperando llamadas entrantes.`
            : "Inicializando canal Realtime..."}
        </p>
      </div>

      {/* RC Embeddable softphone (Slice 3) */}
      {RC_CLIENT_ID ? (
        /* RC widget renders itself as a floating iframe; this card is informational */
        <div className="bg-[#0F2229] border border-[#1d9fa9]/20 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1d9fa9]/15 flex items-center justify-center">
              <Radio className="w-4 h-4 text-[#1d9fa9]" />
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-sm font-semibold text-[#E4EEF0]">Softphone RingCentral</p>
              <p className="text-xs text-[#6A8E98]">
                El widget de RingCentral está activo. Busca el icono flotante de RC en la esquina
                de la pantalla. La primera vez debes iniciar sesión con tu cuenta RC (un solo paso).
              </p>
              <p className="text-xs text-[#94B3BB] mt-2">
                Cuando el sistema marque a un cliente y seleccione tu extensión, recibirás la
                llamada entrante directamente en el widget.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Graceful fallback when VITE_RC_CLIENT_ID is absent */
        <div className="bg-[#0F2229] border border-[#1d9fa9]/10 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
              <PhoneOff className="w-4 h-4 text-orange-400" />
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-sm font-semibold text-[#94B3BB]">
                Softphone: pendiente de configurar el Client ID de RingCentral
              </p>
              <p className="text-xs text-[#6A8E98]">
                Para activar el softphone integrado, un administrador debe configurar{" "}
                <code className="text-[#1d9fa9]">VITE_RC_CLIENT_ID</code> en las variables de
                entorno del despliegue y volver a publicar la aplicación.
              </p>
              <a
                href="/admin/configuracion"
                className="inline-flex items-center gap-1 text-xs text-[#1d9fa9]/70 hover:text-[#1d9fa9] transition-colors mt-1"
              >
                <ExternalLink className="w-3 h-3" />
                Ir a Configuración
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Incoming call pop-up (rendered over the layout when call arrives) */}
      {incomingCall && (
        <IncomingCallPopup
          payload={incomingCall}
          onClose={() => setIncomingCall(null)}
        />
      )}
    </div>
  );
}
