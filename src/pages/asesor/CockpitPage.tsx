// CockpitPage — Slice 2 (presence, heartbeat, Realtime) + Slice 3 (RC Embeddable).
// Slice 3: RC Embeddable softphone injected via useEffect when VITE_RC_CLIENT_ID is set.
// Graceful gating: if clientId is missing, renders a friendly config card instead.
//
// Tareas adicionales:
//   T1: detecta si el softphone tiene sesión iniciada vía window.postMessage (rc-login-status-notify)
//   T2: tarjeta "¿Listo para recibir llamadas?" con 3 chequeos visuales
//   T3: onboarding cálido de primera vez (PrimerosPasos)
//   T4: errores en cristiano — nunca se muestra el mensaje crudo al asesor
import { useEffect, useRef, useState } from "react";
import { Radio, WifiOff, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentAsesorId, updatePresence, getMyNombre } from "@/lib/asesorApi";
import IncomingCallPopup from "@/components/asesor/IncomingCallPopup";
import type { IncomingCallPayload } from "@/components/asesor/IncomingCallPopup";
import SeguimientoReminder from "@/components/asesor/SeguimientoReminder";
import type { SeguimientoReminderPayload } from "@/components/asesor/SeguimientoReminder";
import LeadDetailSheet from "@/components/asesor/LeadDetailSheet";
import DispositionSheet from "@/components/asesor/DispositionSheet";
import PrimerosPasos, { haVistoPrimerosPasos } from "@/components/asesor/PrimerosPasos";

const HEARTBEAT_INTERVAL_MS = 30_000;
const RC_CLIENT_ID = import.meta.env.VITE_RC_CLIENT_ID as string | undefined;
const RC_ADAPTER_SCRIPT = "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.js";

// Mensaje amigable para el asesor cuando algo falla (nunca el texto técnico)
const ERROR_DISPONIBILIDAD =
  "No pudimos actualizar tu disponibilidad. Probá de nuevo en un momento.";

export default function CockpitPage() {
  const [asesorId, setAsesorId] = useState<string | null>(null);
  const [disponible, setDisponible] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCallPayload | null>(null);
  const [presenceError, setPresenceError] = useState<string | null>(null);
  const [seguimientoReminder, setSeguimientoReminder] = useState<SeguimientoReminderPayload | null>(null);
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);
  const [dispositionLead, setDispositionLead] = useState<{ id: string; nombre: string } | null>(null);

  // T1: null = aún no sabemos / true = con sesión / false = sin sesión
  const [softphoneReady, setSoftphoneReady] = useState<boolean | null>(null);

  // Nombre de la asesora — para saludarla y que vea que es SU panel.
  const [nombre, setNombre] = useState<string | null>(null);
  useEffect(() => {
    getMyNombre().then(setNombre).catch(() => {});
  }, []);
  const primerNombre = nombre?.split(" ")[0] ?? null;

  // T3: onboarding
  const [mostrarOnboarding, setMostrarOnboarding] = useState<boolean>(
    !haVistoPrimerosPasos()
  );

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

    // El motor avisa que esta llamada ya no es para este asesor (no contestó →
    // pasó al siguiente, o el intento terminó): cerramos su pop-up.
    channel.on("broadcast", { event: "call_cancelled" }, ({ payload }) => {
      const p = payload as { attempt_id: string | null; lead_id: string | null };
      setIncomingCall((cur) =>
        cur && (cur.attempt_id === p.attempt_id || cur.lead_id === p.lead_id) ? null : cur,
      );
    });

    channel.on("broadcast", { event: "seguimiento_reminder" }, ({ payload }) => {
      setSeguimientoReminder(payload as SeguimientoReminderPayload);
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
  useEffect(() => {
    if (!RC_CLIENT_ID) return;
    if (document.querySelector(`script[data-rc-embeddable]`)) return;

    // Redirect de OAuth en NUESTRO dominio (first-party) → evita el "Login failed
    // due to internal errors" (handoff del popup al widget con cookies de terceros).
    // Hay que registrar esta URL como Redirect URI en el app de RC.
    const redirectUri = `${window.location.origin}/rc-redirect.html`;
    const script = document.createElement("script");
    script.src = `${RC_ADAPTER_SCRIPT}?clientId=${encodeURIComponent(RC_CLIENT_ID)}&appServer=https://platform.ringcentral.com&redirectUri=${encodeURIComponent(redirectUri)}`;
    script.async = true;
    script.setAttribute("data-rc-embeddable", "true");
    document.body.appendChild(script);

    return () => {
      // Do NOT remove on unmount — RC Embeddable manages its own lifecycle
    };
  }, []);

  // ── T1: Detectar si el softphone tiene sesión vía postMessage ────────────
  useEffect(() => {
    if (!RC_CLIENT_ID) return; // RC no configurado → no escuchamos

    function onMsg(e: MessageEvent) {
      const d = e.data;
      if (d && typeof d === "object" && d.type === "rc-login-status-notify") {
        setSoftphoneReady(!!d.loggedIn);
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // ── Toggle availability ───────────────────────────────────────────────────
  const handleToggle = async () => {
    const next = !disponible;
    setToggling(true);
    setPresenceError(null);
    try {
      await updatePresence(next);
      setDisponible(next);
    } catch (e) {
      // T4: log técnico en consola, mensaje humano en UI
      console.error("toggle presencia:", e);
      setPresenceError(ERROR_DISPONIBILIDAD);
    } finally {
      setToggling(false);
    }
  };

  // ── T2: Determinar estado de cada chequeo ────────────────────────────────
  const sistemaOk = !!asesorId;

  // El teléfono aplica solo cuando RC está configurado
  const rcConfigurado = !!RC_CLIENT_ID;
  // softphoneOk: true cuando RC está configurado Y el asesor inició sesión
  const softphoneOk = rcConfigurado && softphoneReady === true;

  const disponibilidadOk = disponible;

  // Banner global: todo OK cuando sistema + disponibilidad están OK
  // (si RC no está configurado, no bloqueamos el estado "todo listo")
  const todoListo = sistemaOk && disponibilidadOk && (!rcConfigurado || softphoneOk);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#E4EEF0]">
          {primerNombre ? `Hola, ${primerNombre} 👋` : "Mi Cockpit"}
        </h1>
        <p className="text-sm text-[#94B3BB] mt-1">Tu centro de llamadas</p>
      </div>

      {/* T3: Onboarding de primera vez */}
      {mostrarOnboarding && (
        <PrimerosPasos onCerrar={() => setMostrarOnboarding(false)} />
      )}

      {/* T2: Tarjeta "¿Listo para recibir llamadas?" */}
      <div className="bg-[#0F2229] border border-[#1d9fa9]/20 rounded-2xl p-6 space-y-5">
        {/* Banner de estado global */}
        {todoListo ? (
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-sm font-semibold text-emerald-300">
              Todo listo. Las llamadas van a sonar acá y en tu teléfono.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <p className="text-sm font-semibold text-amber-300">
              Te falta un paso para recibir llamadas
            </p>
          </div>
        )}

        {/* Chequeo 1: Sistema */}
        <div className="flex items-start gap-3">
          {sistemaOk ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className="text-sm font-semibold text-[#E4EEF0]">Sistema</p>
            <p className="text-xs text-[#94B3BB] mt-0.5">
              {sistemaOk
                ? "Estás conectado."
                : "Conectando con el sistema…"}
            </p>
          </div>
        </div>

        {/* Chequeo 2: Teléfono */}
        <div className="flex items-start gap-3">
          {!rcConfigurado ? (
            <CheckCircle2 className="w-5 h-5 text-[#6A8E98] flex-shrink-0 mt-0.5" />
          ) : softphoneOk ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className="text-sm font-semibold text-[#E4EEF0]">Tu teléfono</p>
            {!rcConfigurado ? (
              <p className="text-xs text-[#6A8E98] mt-0.5">
                Lo activa un administrador.
              </p>
            ) : softphoneOk ? (
              <p className="text-xs text-[#94B3BB] mt-0.5">
                Sesión iniciada. Tu teléfono está listo para recibir llamadas.
              </p>
            ) : (
              <p className="text-xs text-amber-300/80 mt-0.5 leading-relaxed">
                Iniciá sesión en tu teléfono: buscá el botón redondo abajo a la derecha de la pantalla, tocalo e ingresá una sola vez. Después queda listo siempre.
              </p>
            )}
          </div>
        </div>

        {/* Chequeo 3: Disponibilidad — integrado con el toggle */}
        <div className="flex items-start gap-3">
          {disponibilidadOk ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#E4EEF0]">Disponibilidad</p>
            {!disponibilidadOk && (
              <p className="text-xs text-amber-300/80 mt-0.5">
                Activá "Disponible" para empezar a recibir llamadas.
              </p>
            )}

            {/* Toggle inline */}
            <div className="mt-3">
              <button
                onClick={handleToggle}
                disabled={toggling || !asesorId}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
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

            {/* T4: mensaje de error amigable (nunca el texto crudo) */}
            {presenceError && (
              <p className="mt-2 text-xs text-amber-300/80">{presenceError}</p>
            )}
          </div>
        </div>

        {/* Indicador de conexión al sistema */}
        <div className="flex items-center gap-2 pt-1">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              asesorId ? "bg-emerald-400 animate-pulse" : "bg-[#6A8E98]"
            }`}
          />
          <span className="text-[11px] text-[#6A8E98]">
            {asesorId ? "Conectado al sistema" : "Conectando…"}
          </span>
        </div>
      </div>

      {/* Incoming call pop-up */}
      {incomingCall && (
        <IncomingCallPopup
          payload={incomingCall}
          onClose={() => {
            const lid = incomingCall.lead_id;
            const nombre = incomingCall.nombre ?? "este lead";
            setIncomingCall(null);
            if (lid) setDispositionLead({ id: lid, nombre });
          }}
          onVerHistorial={(lead_id) => {
            setIncomingCall(null);
            setOpenLeadId(lead_id);
          }}
        />
      )}

      {/* Seguimiento reminder pop-up */}
      {seguimientoReminder && (
        <SeguimientoReminder
          payload={seguimientoReminder}
          onClose={() => setSeguimientoReminder(null)}
          onVerLead={(lead_id) => setOpenLeadId(lead_id)}
        />
      )}

      {/* Lead detail drawer (opened from reminder or incoming call) */}
      {openLeadId && (
        <LeadDetailSheet
          leadId={openLeadId}
          onClose={() => setOpenLeadId(null)}
          onRefresh={() => {}}
        />
      )}

      {/* Registrar resultado — se abre al terminar la llamada entrante */}
      {dispositionLead && (
        <DispositionSheet
          leadId={dispositionLead.id}
          nombre={dispositionLead.nombre}
          onClose={() => setDispositionLead(null)}
          onSuccess={() => setDispositionLead(null)}
        />
      )}
    </div>
  );
}
