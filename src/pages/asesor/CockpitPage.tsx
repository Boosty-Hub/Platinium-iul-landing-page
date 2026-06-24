// CockpitPage — Slice 2: presence toggle, heartbeat, Realtime pop-up.
// Slice 3 will add RC Embeddable softphone (task 3.8).
import { useEffect, useRef, useState } from "react";
import { Radio, WifiOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentAsesorId, updatePresence } from "@/lib/asesorApi";
import IncomingCallPopup from "@/components/asesor/IncomingCallPopup";
import type { IncomingCallPayload } from "@/components/asesor/IncomingCallPopup";

const HEARTBEAT_INTERVAL_MS = 30_000;

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

      {/* RC Embeddable softphone placeholder (Slice 3 — task 3.8) */}
      <div className="bg-[#0F2229] border border-[#1d9fa9]/10 rounded-2xl p-6 opacity-60">
        <p className="text-sm font-semibold text-[#94B3BB] mb-1">Softphone RingCentral</p>
        <p className="text-xs text-[#6A8E98]">Disponible en Slice 3 — requiere configuración de RC Client ID.</p>
      </div>

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
