// AsesorSessionProvider — la "sesión viva" del asesor.
//
// Vive en el LAYOUT (no en una página), así que el softphone, el latido de
// presencia, la suscripción Realtime y el pop-up de llamada entrante siguen
// activos en TODAS las páginas del asesor (Cockpit, Mis Leads, Historial) y
// NO se cortan al navegar.
//
// Llamadas en otra pestaña: una web no puede dibujar un modal encima de otra
// pestaña, pero sí puede:
//   1. Disparar una Notificación del sistema (aparece sobre cualquier pantalla).
//   2. Dejar sonar el softphone RC (el audio WebRTC no se corta en segundo plano).
//   3. Parpadear el título de la pestaña como pista visual.
// Al volver a la pestaña, el pop-up de Contestar ya está ahí.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentAsesorId, updatePresence } from "@/lib/asesorApi";
import IncomingCallPopup from "@/components/asesor/IncomingCallPopup";
import type { IncomingCallPayload, RingTone } from "@/components/asesor/IncomingCallPopup";
import SeguimientoReminder from "@/components/asesor/SeguimientoReminder";
import type { SeguimientoReminderPayload } from "@/components/asesor/SeguimientoReminder";
import LeadDetailSheet from "@/components/asesor/LeadDetailSheet";
import DispositionSheet from "@/components/asesor/DispositionSheet";

const HEARTBEAT_INTERVAL_MS = 30_000;
const RC_CLIENT_ID = import.meta.env.VITE_RC_CLIENT_ID as string | undefined;
const RC_ADAPTER_SCRIPT =
  "https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/adapter.js";
const RC_WIDGET_ORIGIN = "https://apps.ringcentral.com";

const ERROR_DISPONIBILIDAD =
  "No pudimos actualizar tu disponibilidad. Probá de nuevo en un momento.";
const BASE_TITLE = "Platinium IUL — Asesor";

type NotifPermission = "granted" | "denied" | "default" | "unsupported";

interface AsesorSession {
  asesorId: string | null;
  disponible: boolean;
  toggling: boolean;
  toggleDisponible: () => Promise<void>;
  presenceError: string | null;
  /** RC configurado por el admin (hay client id) */
  rcConfigurado: boolean;
  /** El asesor inició sesión en el softphone */
  softphoneReady: boolean | null;
  /** Permiso de notificaciones del sistema */
  notifPermission: NotifPermission;
  /** Pedir permiso de notificaciones (debe llamarse desde un gesto del usuario) */
  requestNotif: () => void;
  /** true cuando el asesor está realmente en línea para recibir llamadas */
  ready: boolean;
  /** Si NO está listo, qué le falta (para mostrarlo en cualquier página) */
  notReadyReason: string | null;
}

const Ctx = createContext<AsesorSession | null>(null);

export function useAsesorSession(): AsesorSession {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAsesorSession debe usarse dentro de AsesorSessionProvider");
  return ctx;
}

function initialNotifPermission(): NotifPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission as NotifPermission;
}

export default function AsesorSessionProvider({ children }: { children: ReactNode }) {
  const [asesorId, setAsesorId] = useState<string | null>(null);
  const [disponible, setDisponible] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [presenceError, setPresenceError] = useState<string | null>(null);
  const [softphoneReady, setSoftphoneReady] = useState<boolean | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotifPermission>(initialNotifPermission);
  const [sonido, setSonido] = useState<{ tono?: RingTone; volumen?: number }>({});

  const [incomingCall, setIncomingCall] = useState<IncomingCallPayload | null>(null);
  const [seguimientoReminder, setSeguimientoReminder] = useState<SeguimientoReminderPayload | null>(null);
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);
  const [dispositionLead, setDispositionLead] = useState<{ id: string; nombre: string } | null>(null);

  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const incomingCallRef = useRef<IncomingCallPayload | null>(null);
  const notifRef = useRef<Notification | null>(null);
  const titleFlashRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const origTitleRef = useRef<string>(BASE_TITLE);

  useEffect(() => { incomingCallRef.current = incomingCall; }, [incomingCall]);

  // Sonido de llamada configurado por el admin (tono + volumen).
  useEffect(() => {
    (async () => {
      try {
        const { data } = await (supabase as unknown as { rpc: (n: string) => Promise<{ data: unknown }> }).rpc("get_sonido_config");
        const c = data as { tono?: string; volumen?: string } | null;
        if (c && typeof c === "object") {
          setSonido({ tono: c.tono as RingTone, volumen: c.volumen != null ? Number(c.volumen) : undefined });
        }
      } catch { /* si falla, el pop-up usa el default */ }
    })();
  }, []);

  // ── Avisos en segundo plano (notificación del sistema + título parpadeante) ──
  const stopAlerts = useCallback(() => {
    if (notifRef.current) {
      try { notifRef.current.close(); } catch { /* ignore */ }
      notifRef.current = null;
    }
    if (titleFlashRef.current) {
      clearInterval(titleFlashRef.current);
      titleFlashRef.current = null;
    }
    document.title = origTitleRef.current;
  }, []);

  const fireAlerts = useCallback((p: IncomingCallPayload) => {
    const nombre = p.nombre ?? "Llamada entrante";
    // 1. Notificación del sistema — aparece aunque la pestaña esté en segundo plano.
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        const n = new Notification(`📞 ${nombre}`, {
          body: p.telefono ? `${p.telefono} — tocá para atender` : "Tocá para volver y atender",
          icon: "/logo.png",
          tag: "incoming-call",
          requireInteraction: true,
        });
        n.onclick = () => { window.focus(); n.close(); };
        notifRef.current = n;
      } catch { /* algunos navegadores limitan Notification fuera de SW */ }
    }
    // 2. Título parpadeante como pista visual en la pestaña.
    if (titleFlashRef.current) clearInterval(titleFlashRef.current);
    let on = false;
    titleFlashRef.current = setInterval(() => {
      document.title = on ? origTitleRef.current : `📞 ${nombre}`;
      on = !on;
    }, 1000);
  }, []);

  // Cuando se cierra/termina la llamada entrante, cortamos los avisos.
  useEffect(() => {
    if (!incomingCall) stopAlerts();
  }, [incomingCall, stopAlerts]);

  useEffect(() => () => stopAlerts(), [stopAlerts]);

  // Reportamos también el estado real (softphone + avisos) en cada presencia, vía
  // refs, para no reiniciar los timers cuando esos valores cambian.
  const softphoneReadyRef = useRef<boolean | null>(softphoneReady);
  useEffect(() => { softphoneReadyRef.current = softphoneReady; }, [softphoneReady]);
  const notifPermissionRef = useRef<NotifPermission>(notifPermission);
  useEffect(() => { notifPermissionRef.current = notifPermission; }, [notifPermission]);
  const reportPresence = useCallback(
    (disp?: boolean) => updatePresence(disp, softphoneReadyRef.current === true, notifPermissionRef.current === "granted"),
    [],
  );

  // ── Init: resolver el id del asesor y marcar presencia inicial ────────────
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const id = await getCurrentAsesorId();
        if (!active || !id) return;
        setAsesorId(id);
        await reportPresence(true);
        setDisponible(true);
      } catch (e) {
        console.error("asesor session init:", e);
      }
    })();
    return () => { active = false; };
  }, []);

  // ── Latido de presencia cada 30s mientras la sesión esté montada ──────────
  // Como vive en el layout, no se corta al navegar entre páginas.
  useEffect(() => {
    if (!asesorId) return;
    heartbeatRef.current = setInterval(async () => {
      try {
        await reportPresence(disponible);
      } catch (e) {
        console.error("presence heartbeat:", e);
      }
    }, HEARTBEAT_INTERVAL_MS);
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [asesorId, disponible]);

  // Refrescar presencia al volver a la pestaña (los timers en segundo plano se ralentizan).
  useEffect(() => {
    if (!asesorId) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        reportPresence(disponible).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [asesorId, disponible]);

  // ── Realtime: llamadas entrantes, cancelaciones y recordatorios ───────────
  useEffect(() => {
    if (!asesorId) return;
    const channel = supabase.channel(`advisor:${asesorId}`, {
      config: { broadcast: { self: false } },
    });

    channel.on("broadcast", { event: "incoming_call" }, ({ payload }) => {
      const p = payload as IncomingCallPayload;
      setIncomingCall(p);
      fireAlerts(p);
    });

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
      if (status === "CHANNEL_ERROR") console.error("Realtime channel error:", asesorId);
    });

    return () => { supabase.removeChannel(channel); };
  }, [asesorId, fireAlerts]);

  // ── RC Embeddable: inyectar el softphone una sola vez ─────────────────────
  // El iframe queda en document.body y persiste aunque cambie la página.
  useEffect(() => {
    if (!RC_CLIENT_ID) return;
    if (document.querySelector("script[data-rc-embeddable]")) return;
    const script = document.createElement("script");
    script.src = `${RC_ADAPTER_SCRIPT}?clientId=${encodeURIComponent(RC_CLIENT_ID)}&appServer=https://platform.ringcentral.com`;
    script.async = true;
    script.setAttribute("data-rc-embeddable", "true");
    document.body.appendChild(script);
    // No lo removemos en unmount — RC maneja su propio ciclo de vida.
  }, []);

  // ── Eventos del softphone (login + colgar) ────────────────────────────────
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.origin !== RC_WIDGET_ORIGIN) return;
      const d = e.data as { type?: string; loggedIn?: boolean } | null;
      if (!d || typeof d !== "object") return;
      if (d.type === "rc-login-status-notify") {
        setSoftphoneReady(!!d.loggedIn);
      } else if (d.type === "rc-call-end-notify") {
        // Al colgar: cerramos el pop-up entrante y abrimos "¿Cómo fue la llamada?".
        const cur = incomingCallRef.current;
        if (cur?.lead_id) setDispositionLead({ id: cur.lead_id, nombre: cur.nombre ?? "este lead" });
        setIncomingCall(null);
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // ── Notificaciones del sistema ────────────────────────────────────────────
  const requestNotif = useCallback(() => {
    if (!("Notification" in window)) { setNotifPermission("unsupported"); return; }
    Notification.requestPermission().then((p) => setNotifPermission(p as NotifPermission)).catch(() => {});
  }, []);

  // ── Toggle de disponibilidad ──────────────────────────────────────────────
  const toggleDisponible = useCallback(async () => {
    const next = !disponible;
    setToggling(true);
    setPresenceError(null);
    // Al ponerse Disponible aprovechamos el gesto para pedir permiso de avisos.
    if (next && "Notification" in window && Notification.permission === "default") {
      requestNotif();
    }
    try {
      await reportPresence(next);
      setDisponible(next);
    } catch (e) {
      console.error("toggle presencia:", e);
      setPresenceError(ERROR_DISPONIBILIDAD);
    } finally {
      setToggling(false);
    }
  }, [disponible, requestNotif]);

  // ── Estado "listo para recibir" (visible en cualquier página/pestaña) ──────
  const rcConfigurado = !!RC_CLIENT_ID;
  const softphoneOk = rcConfigurado ? softphoneReady === true : true;
  const ready = !!asesorId && disponible && softphoneOk;
  const notReadyReason = ready
    ? null
    : !asesorId
      ? "Conectando con el sistema…"
      : rcConfigurado && softphoneReady !== true
        ? "Iniciá sesión en tu teléfono: botón redondo abajo a la derecha."
        : !disponible
          ? 'Activá "Disponible" para recibir llamadas.'
          : "Revisá tu conexión.";

  // El título de la pestaña refleja el estado, así se ve aunque estés en otra
  // pestaña (Kommo, etc.). El flash de llamada entrante tiene prioridad.
  useEffect(() => {
    if (incomingCall) return;
    document.title = ready ? BASE_TITLE : "🔴 No recibís llamadas · Platinium";
  }, [ready, incomingCall]);

  const value: AsesorSession = {
    asesorId,
    disponible,
    toggling,
    toggleDisponible,
    presenceError,
    rcConfigurado,
    softphoneReady,
    notifPermission,
    requestNotif,
    ready,
    notReadyReason,
  };

  return (
    <Ctx.Provider value={value}>
      {children}

      {/* Pop-ups globales — viven en el layout, así suenan en cualquier página */}
      {incomingCall && (
        <IncomingCallPopup
          payload={incomingCall}
          sonido={sonido}
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

      {seguimientoReminder && (
        <SeguimientoReminder
          payload={seguimientoReminder}
          onClose={() => setSeguimientoReminder(null)}
          onVerLead={(lead_id) => setOpenLeadId(lead_id)}
        />
      )}

      {openLeadId && (
        <LeadDetailSheet leadId={openLeadId} onClose={() => setOpenLeadId(null)} onRefresh={() => {}} />
      )}

      {dispositionLead && (
        <DispositionSheet
          leadId={dispositionLead.id}
          nombre={dispositionLead.nombre}
          onClose={() => setDispositionLead(null)}
          onSuccess={() => setDispositionLead(null)}
        />
      )}
    </Ctx.Provider>
  );
}
