import { useEffect, useRef, useState, useCallback, Fragment } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LeadAlertModal } from "@/components/panel/LeadAlertModal";
import { LeadDetails } from "@/components/panel/LeadDetails";
import { OriginBadge } from "@/components/panel/OriginBadge";
import { Lead, LEAD_SELECT_COLS } from "@/components/panel/types";
import { getLeadOrigin } from "@/lib/leadOrigin";
import { toast } from "@/hooks/use-toast";
import { ChevronDown, Volume2, VolumeX } from "lucide-react";

type ConnState = "connected" | "reconnecting" | "disconnected";

const SELECT_COLS = LEAD_SELECT_COLS;

export default function LeadsBoard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [alertQueue, setAlertQueue] = useState<Lead[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [connState, setConnState] = useState<ConnState>("reconnecting");
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpanded = (id: string) => setExpandedId((cur) => (cur === id ? null : id));

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
          wasConnectedRef.current = true;
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

    // Heartbeat: every 15s, if not connected, force reconnect
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

  const toggleAudio = async () => {
    if (audioEnabled) {
      setAudioEnabled(false);
      return;
    }
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
    <div>
      <audio ref={audioRef} src="/alarm.mp3" preload="auto" />

      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-[#E4EEF0]">Leads entrantes</h2>
          <div className="flex items-center gap-2 mt-1 text-sm text-[#94B3BB]">
            <span className={`inline-block w-2 h-2 rounded-full ${dotClass}`} />
            {stateLabel}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-2xl font-bold text-[#1d9fa9]">{leads.length}</div>
            <div className="text-xs text-[#94B3BB]">leads cargados</div>
          </div>
          <button
            onClick={toggleAudio}
            title={audioEnabled ? "Desactivar alertas de sonido" : "Activar alertas de sonido"}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
              audioEnabled
                ? "bg-[#1d9fa9]/20 border-[#1d9fa9]/50 text-[#1d9fa9] hover:bg-[#1d9fa9]/30"
                : "border-[#1d9fa9]/25 text-[#94B3BB] hover:text-white hover:border-[#1d9fa9]/60"
            }`}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{audioEnabled ? "Sonido activo" : "Sin sonido"}</span>
          </button>
        </div>
      </div>

      {leads.length === 0 && (
        <div className="rounded-xl border border-[#1d9fa9]/20 bg-[#0F2229] py-12 text-center text-[#94B3BB]">
          Aún no hay leads. Esperando…
        </div>
      )}

      {/* DESKTOP / TABLET TABLE */}
      {leads.length > 0 && (
        <div className="hidden md:block rounded-xl border border-[#1d9fa9]/20 overflow-hidden bg-[#0F2229]">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col className="w-[110px]" />
              <col />
              <col className="w-[200px] lg:w-[220px]" />
              <col className="w-[240px] lg:w-[280px]" />
              <col className="w-[40px]" />
            </colgroup>
            <thead className="bg-[#0B1A1E] text-[#94B3BB] uppercase text-[11px] tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Hora</th>
                <th className="text-left px-4 py-3">Contacto</th>
                <th className="text-left px-4 py-3">Ubicación</th>
                <th className="text-left px-4 py-3">Origen</th>
                <th className="px-2 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => {
                const origin = getLeadOrigin(l);
                const isOpen = expandedId === l.id;
                return (
                  <Fragment key={l.id}>
                    <tr
                      onClick={() => toggleExpanded(l.id)}
                      className={`border-t border-[#1d9fa9]/10 transition-colors cursor-pointer align-top ${
                        highlightId === l.id ? "bg-[#1d9fa9]/15 animate-in fade-in slide-in-from-top-2" : "hover:bg-[#1d9fa9]/5"
                      }`}
                    >
                      <td className="px-4 py-3 text-[#94B3BB] whitespace-nowrap text-xs leading-tight">
                        <div className="font-mono">{new Date(l.created_at).toLocaleTimeString("es-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
                        <div className="text-[#6A8E98]">{new Date(l.created_at).toLocaleDateString("es-US", { day: "2-digit", month: "2-digit" })}</div>
                      </td>
                      <td className="px-4 py-3 leading-tight">
                        <div className="font-semibold text-[#E4EEF0] truncate">{l.nombre}</div>
                        <a href={`tel:${l.telefono}`} onClick={(e) => e.stopPropagation()} className="text-[#1d9fa9] hover:underline text-xs block">{l.telefono}</a>
                        <a href={`mailto:${l.email}`} onClick={(e) => e.stopPropagation()} className="text-[#94B3BB] hover:text-[#1d9fa9] hover:underline text-xs block truncate">{l.email}</a>
                      </td>
                      <td className="px-4 py-3 leading-tight">
                        <div className="text-[#E4EEF0] text-sm truncate">
                          {l.city ? `${l.city}${l.region ? `, ${l.region}` : ""}` : <span className="text-[#6A8E98]">—</span>}
                        </div>
                        <div className="font-mono text-[11px] text-[#6A8E98] hidden lg:block truncate">{l.ip_address || "—"}</div>
                      </td>
                      <td className="px-4 py-3 leading-tight">
                        <OriginBadge origin={origin} />
                        {origin.campaign && (
                          <div className="mt-1 text-xs text-[#E4EEF0] truncate" title={origin.campaign}>{origin.campaign}</div>
                        )}
                        {origin.detail && (
                          <div className="text-[11px] text-[#6A8E98] hidden lg:block truncate" title={origin.detail}>{origin.detail}</div>
                        )}
                      </td>
                      <td className="px-2 py-3 text-[#6A8E98]">
                        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-[#0B1A1E]/60 border-t border-[#1d9fa9]/10">
                        <td colSpan={5} className="px-6 py-4">
                          <LeadDetails lead={l} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MOBILE CARDS */}
      {leads.length > 0 && (
        <div className="md:hidden space-y-3">
          {leads.map((l) => {
            const origin = getLeadOrigin(l);
            const isOpen = expandedId === l.id;
            return (
              <div
                key={l.id}
                className={`rounded-xl border bg-[#0F2229] p-4 transition-colors ${
                  highlightId === l.id ? "border-[#1d9fa9] bg-[#1d9fa9]/10" : "border-[#1d9fa9]/20"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[#E4EEF0] truncate">{l.nombre}</div>
                    <a href={`tel:${l.telefono}`} className="text-[#1d9fa9] text-sm block">{l.telefono}</a>
                    <a href={`mailto:${l.email}`} className="text-[#94B3BB] text-xs block truncate">{l.email}</a>
                  </div>
                  <div className="text-right text-[11px] text-[#6A8E98] whitespace-nowrap font-mono">
                    <div>{new Date(l.created_at).toLocaleTimeString("es-US", { hour: "2-digit", minute: "2-digit" })}</div>
                    <div>{new Date(l.created_at).toLocaleDateString("es-US", { day: "2-digit", month: "2-digit" })}</div>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs border-t border-[#1d9fa9]/10 pt-2">
                  <div className="flex items-center gap-2 text-[#94B3BB]">
                    <span aria-hidden>📍</span>
                    <span className="truncate">
                      {l.city ? `${l.city}${l.region ? `, ${l.region}` : ""}` : "Ubicación desconocida"}
                      {l.ip_address && <span className="text-[#6A8E98] font-mono ml-2">{l.ip_address}</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <OriginBadge origin={origin} />
                    {origin.campaign && <span className="text-[#E4EEF0] truncate">{origin.campaign}</span>}
                  </div>
                  {l.interes && (
                    <div className="flex items-start gap-2 text-[#94B3BB]">
                      <span aria-hidden>💬</span>
                      <span className="truncate">{l.interes}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => toggleExpanded(l.id)}
                  className="mt-3 w-full flex items-center justify-center gap-1 text-xs text-[#1d9fa9] hover:text-[#5fd0d9] py-2 border-t border-[#1d9fa9]/10"
                >
                  {isOpen ? "Ocultar detalles" : "Ver más"}
                  <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="mt-3 pt-3 border-t border-[#1d9fa9]/10">
                    <LeadDetails lead={l} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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
