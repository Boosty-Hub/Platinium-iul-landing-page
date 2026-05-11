import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LeadAlertModal } from "@/components/panel/LeadAlertModal";
import { toast } from "@/hooks/use-toast";

interface Lead {
  id: string;
  created_at: string;
  nombre: string;
  telefono: string;
  email: string;
  city?: string | null;
  region?: string | null;
  ip_address?: string | null;
  interes?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  referrer?: string | null;
}

type ConnState = "connected" | "reconnecting" | "disconnected";

const SELECT_COLS = "id, created_at, nombre, telefono, email, city, region, ip_address, interes, utm_source, utm_medium, utm_campaign, utm_term, utm_content, gclid, fbclid, referrer";

type OriginInfo = { label: string; cls: string };

function getOrigin(l: Lead): OriginInfo {
  const src = (l.utm_source || "").toLowerCase();
  const med = (l.utm_medium || "").toLowerCase();
  const ref = (l.referrer || "").toLowerCase();
  const isPaid = med.includes("cpc") || med.includes("paid") || med.includes("ads");

  if (l.gclid || (src.includes("google") && isPaid)) return { label: "Google Ads", cls: "bg-blue-500/20 text-blue-300 border-blue-400/40" };
  if (l.fbclid || src.includes("facebook") || src.includes("meta") || src.includes("instagram") || src === "ig" || src === "fb")
    return { label: isPaid ? "Meta Ads" : "Meta", cls: "bg-pink-500/20 text-pink-300 border-pink-400/40" };
  if (src.includes("google") || ref.includes("google.")) return { label: "Google Orgánico", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40" };
  if (ref.includes("facebook.") || ref.includes("instagram.") || ref.includes("fb.")) return { label: "Meta Orgánico", cls: "bg-pink-500/10 text-pink-200 border-pink-400/30" };
  if (src.includes("tiktok") || ref.includes("tiktok.")) return { label: "TikTok", cls: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400/40" };
  if (src || med || ref) return { label: src || ref.replace(/^https?:\/\//, "").split("/")[0] || "Referencia", cls: "bg-amber-500/20 text-amber-300 border-amber-400/40" };
  return { label: "Directo", cls: "bg-white/10 text-[#94B3BB] border-white/20" };
}

export default function FormPanel() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [alertQueue, setAlertQueue] = useState<Lead[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [connState, setConnState] = useState<ConnState>("reconnecting");
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const latestCreatedAtRef = useRef<string | null>(null);
  const lastSyncAtRef = useRef(Date.now());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const wasConnectedRef = useRef(false);
  const connectRef = useRef<() => void>(() => {});

  // Add a lead to state (dedup) and to alert queue if new
  const ingestLead = useCallback((lead: Lead, fromInitial = false) => {
    if (!latestCreatedAtRef.current || lead.created_at > latestCreatedAtRef.current) {
      latestCreatedAtRef.current = lead.created_at;
    }
    if (seenIdsRef.current.has(lead.id)) return;
    seenIdsRef.current.add(lead.id);
    setLeads((prev) => {
      if (prev.some((l) => l.id === lead.id)) return prev;
      return [lead, ...prev].slice(0, 200);
    });
    if (!fromInitial) {
      setAlertQueue((q) => (q.some((l) => l.id === lead.id) ? q : [...q, lead]));
      setHighlightId(lead.id);
      setTimeout(() => setHighlightId((h) => (h === lead.id ? null : h)), 5000);
    }
  }, []);

  // Resync: fetch any leads newer than what we have
  const resync = useCallback(async (silent = false) => {
    const latestIso = latestCreatedAtRef.current;
    let q = supabase.from("leads").select(SELECT_COLS).limit(200);
    q = latestIso
      ? q.gt("created_at", latestIso).order("created_at", { ascending: true })
      : q.order("created_at", { ascending: false }).limit(50);
    const { data, error } = await q;
    if (error || !data) return;
    lastSyncAtRef.current = Date.now();
    const rows = latestIso ? data : [...data].reverse();
    rows.forEach((l) => ingestLead(l as Lead, silent));
  }, [ingestLead]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimerRef.current) return;
    const attempt = reconnectAttemptsRef.current++;
    const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
    reconnectTimerRef.current = window.setTimeout(() => {
      reconnectTimerRef.current = null;
      connectRef.current();
    }, delay);
  }, []);

  const connect = useCallback(() => {
    if (channelRef.current) {
      try { supabase.removeChannel(channelRef.current); } catch {}
      channelRef.current = null;
    }
    setConnState((s) => (s === "connected" ? "reconnecting" : s));

    const channel = supabase
      .channel(`leads-panel-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leads" },
        (payload) => ingestLead(payload.new as Lead)
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnState("connected");
          reconnectAttemptsRef.current = 0;
          if (wasConnectedRef.current) {
            toast({ title: "Conexión restaurada", description: "Recibiendo leads en vivo otra vez." });
          }
          wasConnectedRef.current = true;
          // Catch up on anything we missed
          resync(true);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setConnState("reconnecting");
          scheduleReconnect();
        }
      });

    channelRef.current = channel;
  }, [ingestLead, resync, scheduleReconnect]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    document.title = "Panel de Leads en Vivo · Platinium";

    // Initial load
    supabase
      .from("leads")
      .select(SELECT_COLS)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (data) {
          (data as Lead[]).forEach((l) => seenIdsRef.current.add(l.id));
          latestCreatedAtRef.current = (data as Lead[])[0]?.created_at ?? null;
          lastSyncAtRef.current = Date.now();
          setLeads(data as Lead[]);
        }
      });

    connect();

    // Heartbeat: every 30s, if not connected, force reconnect
    const heartbeat = window.setInterval(() => {
      setConnState((s) => {
        if (s !== "connected") connect();
        return s;
      });
      if (Date.now() - lastSyncAtRef.current > 45000) {
        resync(false);
        connect();
      }
    }, 15000);

    // Backup polling: fetch missed leads even if realtime silently drops
    const polling = window.setInterval(() => { resync(false); }, 10000);

    // Reconnect on tab focus
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        connect();
        resync(false);
      }
    };
    const onOnline = () => connect();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);

    return () => {
      window.clearInterval(heartbeat);
      window.clearInterval(polling);
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
      if (channelRef.current) { try { supabase.removeChannel(channelRef.current); } catch {} }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enableAudio = async () => {
    const audio = audioRef.current;
    if (audio) {
      try {
        audio.volume = 0;
        await audio.play();
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 1;
      } catch {}
    }
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      await ctx.resume();
      ctx.close();
    } catch {}
    setAudioEnabled(true);
  };

  const fmtTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("es-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) +
      " · " + d.toLocaleDateString("es-US", { day: "2-digit", month: "2-digit" });
  };

  const dismissCurrent = () => setAlertQueue((q) => q.slice(1));
  const dismissAll = () => setAlertQueue([]);

  const currentAlert = alertQueue[0] ?? null;

  const dotClass =
    connState === "connected" ? "bg-green-400 animate-pulse"
    : connState === "reconnecting" ? "bg-yellow-400 animate-pulse"
    : "bg-red-500";
  const stateLabel =
    connState === "connected" ? "Conectado"
    : connState === "reconnecting" ? "Reconectando…"
    : "Desconectado";

  return (
    <div className="min-h-screen bg-[#0B1A1E] text-white">
      <audio ref={audioRef} src="/alarm.mp3" preload="auto" />

      {!audioEnabled && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/95 p-6">
          <div className="text-center max-w-md space-y-6">
            <div className="text-6xl">🔔</div>
            <h2 className="text-2xl font-bold">Activa las alertas sonoras</h2>
            <p className="text-[#94B3BB]">
              Para que el panel pueda reproducir la alarma cuando llegue un nuevo lead,
              tu navegador requiere que actives el sonido manualmente.
            </p>
            <button
              onClick={enableAudio}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white font-bold text-lg shadow-lg hover:scale-[1.02] transition-transform"
            >
              🔔 Activar Alertas
            </button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-[#1d9fa9]/20 bg-[#0B1A1E]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Platinium" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="text-xl font-bold">Panel de Leads en Vivo</h1>
              <div className="flex items-center gap-2 text-sm text-[#94B3BB]">
                <span className={`inline-block w-2 h-2 rounded-full ${dotClass}`} />
                {stateLabel}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#1d9fa9]">{leads.length}</div>
            <div className="text-xs text-[#94B3BB]">leads cargados</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="rounded-xl border border-[#1d9fa9]/20 overflow-hidden bg-[#0F2229]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0B1A1E] text-[#94B3BB] uppercase text-xs">
                <tr>
                  <th className="text-left px-4 py-3">Hora</th>
                  <th className="text-left px-4 py-3">Nombre</th>
                  <th className="text-left px-4 py-3">Teléfono</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Ciudad</th>
                  <th className="text-left px-4 py-3">Origen</th>
                  <th className="text-left px-4 py-3">Búsqueda / Campaña</th>
                  <th className="text-left px-4 py-3">Interés</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-12 text-[#94B3BB]">Aún no hay leads. Esperando…</td></tr>
                )}
                {leads.map((l) => {
                  const origin = getOrigin(l);
                  return (
                  <tr
                    key={l.id}
                    className={`border-t border-[#1d9fa9]/10 transition-colors ${
                      highlightId === l.id ? "bg-[#1d9fa9]/20 animate-in fade-in slide-in-from-top-2" : "hover:bg-[#1d9fa9]/5"
                    }`}
                  >
                    <td className="px-4 py-3 text-[#94B3BB] whitespace-nowrap">{fmtTime(l.created_at)}</td>
                    <td className="px-4 py-3 font-medium">{l.nombre}</td>
                    <td className="px-4 py-3"><a href={`tel:${l.telefono}`} className="text-[#1d9fa9] hover:underline">{l.telefono}</a></td>
                    <td className="px-4 py-3"><a href={`mailto:${l.email}`} className="text-[#1d9fa9] hover:underline">{l.email}</a></td>
                    <td className="px-4 py-3">{l.city ? `${l.city}${l.region ? `, ${l.region}` : ""}` : <span className="text-[#6A8E98]">—</span>}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded-md text-xs font-semibold border ${origin.cls}`}>{origin.label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs max-w-[220px]">
                      {l.utm_term ? (
                        <div className="text-[#1d9fa9] font-medium truncate" title={l.utm_term}>🔍 {l.utm_term}</div>
                      ) : null}
                      {l.utm_campaign ? (
                        <div className="text-[#94B3BB] truncate" title={l.utm_campaign}>📣 {l.utm_campaign}</div>
                      ) : null}
                      {!l.utm_term && !l.utm_campaign && (
                        <span className="text-[#6A8E98]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#94B3BB] max-w-xs truncate">{l.interes || "—"}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <LeadAlertModal
        lead={currentAlert}
        queueSize={alertQueue.length}
        onClose={dismissCurrent}
        onDismissAll={dismissAll}
        audioRef={audioRef}
        audioEnabled={audioEnabled}
      />
    </div>
  );
}
