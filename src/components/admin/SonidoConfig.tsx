// SonidoConfig — el admin elige el sonido de llamada entrante del asesor.
// Se guarda en app_integraciones (clave 'sonido') y el asesor lo lee vía
// get_sonido_config(). "Probar" previsualiza el tono con el mismo generador.
import { useRef, useState } from "react";
import { Volume2, Play, Save, Check } from "lucide-react";
import { upsertIntegracion } from "@/lib/adminApi";
import type { Integracion } from "@/lib/adminApi";
import { startRing, type RingTone } from "@/components/asesor/IncomingCallPopup";

const TONOS: { value: RingTone; label: string }[] = [
  { value: "urgente", label: "Urgente — triple beep fuerte (recomendado)" },
  { value: "sirena", label: "Sirena — dos tonos alternados" },
  { value: "campana", label: "Campana" },
  { value: "clasico", label: "Clásico — un beep" },
];

export default function SonidoConfig({ data, onSaved }: { data: Integracion | null; onSaved: () => void }) {
  const [tono, setTono] = useState<RingTone>((data?.config?.tono as RingTone) || "urgente");
  const [volumen, setVolumen] = useState<number>(
    data?.config?.volumen != null ? Math.round(Number(data.config.volumen) * 100) : 90,
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  const probar = () => {
    stopRef.current?.();
    stopRef.current = startRing(tono, volumen / 100);
    window.setTimeout(() => stopRef.current?.(), 2500);
  };

  const guardar = async () => {
    setSaving(true);
    setErr(null);
    try {
      await upsertIntegracion("sonido", "Sonido de llamada", { tono, volumen: String(volumen / 100) }, true);
      setSaved(true);
      onSaved();
      window.setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-[#94B3BB]">
        Este es el sonido que le suena al asesor cuando entra una llamada, para que conteste.
        Tocá <span className="text-[#1d9fa9] font-medium">Probar</span> para escucharlo.
      </p>

      {/* Tono */}
      <div className="space-y-1.5">
        <label className="text-xs text-[#6A8E98] font-medium uppercase tracking-wider">Tono</label>
        <select
          value={tono}
          onChange={(e) => setTono(e.target.value as RingTone)}
          className="w-full h-10 rounded-xl bg-[#0B1A1E] border border-[#1d9fa9]/25 text-[#E4EEF0] text-sm px-3 focus:outline-none focus:border-[#1d9fa9]/60"
        >
          {TONOS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Volumen */}
      <div className="space-y-1.5">
        <label className="text-xs text-[#6A8E98] font-medium uppercase tracking-wider flex items-center gap-2">
          <Volume2 className="w-3.5 h-3.5" /> Volumen — {volumen}%
        </label>
        <input
          type="range"
          min={20}
          max={100}
          step={5}
          value={volumen}
          onChange={(e) => setVolumen(Number(e.target.value))}
          className="w-full accent-[#1d9fa9]"
        />
      </div>

      {err && <p className="text-xs text-red-400">{err}</p>}

      <div className="flex gap-2">
        <button
          onClick={probar}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#1d9fa9]/30 text-[#94B3BB] hover:text-white hover:border-[#1d9fa9]/60 text-sm font-medium transition-colors"
        >
          <Play className="w-4 h-4" /> Probar
        </button>
        <button
          onClick={guardar}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1d9fa9] hover:bg-[#1d9fa9]/80 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? "Guardando…" : saved ? "Guardado" : "Guardar"}
        </button>
      </div>
    </div>
  );
}
