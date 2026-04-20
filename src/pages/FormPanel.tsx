import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LeadAlertModal } from "@/components/panel/LeadAlertModal";

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
}

export default function FormPanel() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [alertLead, setAlertLead] = useState<Lead | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [connected, setConnected] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    document.title = "Panel de Leads en Vivo · Platinium";

    // Initial load
    supabase
      .from("leads")
      .select("id, created_at, nombre, telefono, email, city, region, ip_address, interes")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => { if (data) setLeads(data as Lead[]); });

    // Realtime subscription
    const channel = supabase
      .channel("leads-panel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leads" },
        (payload) => {
          const newLead = payload.new as Lead;
          setLeads((prev) => [newLead, ...prev].slice(0, 200));
          setAlertLead(newLead);
          setHighlightId(newLead.id);
          setTimeout(() => setHighlightId((h) => (h === newLead.id ? null : h)), 5000);
        }
      )
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));

    return () => { supabase.removeChannel(channel); };
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
    // Also unlock Web Audio API
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
                <span className={`inline-block w-2 h-2 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-red-500"}`} />
                {connected ? "Conectado" : "Desconectado"}
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
                  <th className="text-left px-4 py-3">IP</th>
                  <th className="text-left px-4 py-3">Interés</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-12 text-[#94B3BB]">Aún no hay leads. Esperando…</td></tr>
                )}
                {leads.map((l) => (
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
                    <td className="px-4 py-3 font-mono text-xs text-[#94B3BB]">{l.ip_address || "—"}</td>
                    <td className="px-4 py-3 text-[#94B3BB] max-w-xs truncate">{l.interes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <LeadAlertModal
        lead={alertLead}
        onClose={() => setAlertLead(null)}
        audioRef={audioRef}
        audioEnabled={audioEnabled}
      />
    </div>
  );
}
