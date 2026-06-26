import { useEffect, useState } from "react";
import { Loader2, X, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Horario, HorarioDia, getHorario, saveHorario } from "@/lib/adminApi";
import { toast } from "@/hooks/use-toast";

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern (America/New_York)" },
  { value: "America/Bogota", label: "Colombia (America/Bogota)" },
  { value: "America/Chicago", label: "Central (America/Chicago)" },
  { value: "America/Mexico_City", label: "México (America/Mexico_City)" },
  { value: "UTC", label: "UTC" },
] as const;

const DIAS: { key: string; label: string }[] = [
  { key: "lunes", label: "Lunes" },
  { key: "martes", label: "Martes" },
  { key: "miercoles", label: "Miércoles" },
  { key: "jueves", label: "Jueves" },
  { key: "viernes", label: "Viernes" },
  { key: "sabado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
];

// Unidades para los reintentos (internamente todo se guarda en MINUTOS).
const UNIDADES = [
  { value: "min", label: "minutos", factor: 1 },
  { value: "horas", label: "horas", factor: 60 },
  { value: "dias", label: "días", factor: 1440 },
  { value: "semanas", label: "semanas", factor: 10080 },
] as const;

// Muestra un delay en minutos con la unidad más natural (90→"1 h 30 min", 1440→"1 día").
function fmtDelay(min: number): string {
  if (min >= 10080 && min % 10080 === 0) { const n = min / 10080; return `${n} sem`; }
  if (min >= 1440 && min % 1440 === 0) { const n = min / 1440; return `${n} día${n > 1 ? "s" : ""}`; }
  if (min >= 60 && min % 60 === 0) { const n = min / 60; return `${n} h`; }
  if (min >= 60) return `${Math.floor(min / 60)} h ${min % 60} min`;
  return `${min} min`;
}

export default function HorarioConfig() {
  const [horario, setHorario] = useState<Horario | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [retryInput, setRetryInput] = useState("");
  const [retryUnit, setRetryUnit] = useState<string>("min");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getHorario()
      .then((h) => {
        if (!cancelled) setHorario(h);
      })
      .catch((err) => {
        toast({
          title: "Error cargando horario",
          description: err instanceof Error ? err.message : "Error desconocido",
          variant: "destructive",
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading || !horario) {
    return (
      <div className="flex items-center gap-2 py-6 text-[#6A8E98] text-sm">
        <Loader2 className="w-4 h-4 animate-spin text-[#1d9fa9]" />
        Cargando configuración de horario…
      </div>
    );
  }

  const setDia = (key: string, patch: Partial<HorarioDia>) => {
    setHorario((h) =>
      h
        ? {
            ...h,
            schedule: {
              ...h.schedule,
              [key]: { ...h.schedule[key], ...patch },
            },
          }
        : h
    );
  };

  const addRetryDelay = () => {
    const val = parseInt(retryInput.trim(), 10);
    if (isNaN(val) || val <= 0) {
      toast({ title: "Ingresá un número válido", variant: "destructive" });
      return;
    }
    const factor = UNIDADES.find((u) => u.value === retryUnit)?.factor ?? 1;
    const minutos = val * factor;
    setHorario((h) =>
      h ? { ...h, client_retry_delays_min: [...h.client_retry_delays_min, minutos].sort((a, b) => a - b) } : h
    );
    setRetryInput("");
  };

  const removeRetryDelay = (idx: number) => {
    setHorario((h) =>
      h
        ? { ...h, client_retry_delays_min: h.client_retry_delays_min.filter((_, i) => i !== idx) }
        : h
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!horario) return;
    setSaving(true);
    try {
      await saveHorario(horario);
      toast({ title: "Horario guardado", description: "Configuración actualizada." });
    } catch (err: unknown) {
      toast({
        title: "Error al guardar",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Timezone */}
      <div className="space-y-1.5">
        <Label htmlFor="horario-tz" className="text-[#94B3BB] text-sm">Zona horaria</Label>
        <Select
          value={horario.timezone}
          onValueChange={(v) => setHorario((h) => (h ? { ...h, timezone: v } : h))}
        >
          <SelectTrigger
            id="horario-tz"
            className="bg-[#0B1A1E] border-[#1d9fa9]/20 text-[#E4EEF0] focus:border-[#1d9fa9]"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#0F2229] border-[#1d9fa9]/20">
            {TIMEZONES.map((tz) => (
              <SelectItem
                key={tz.value}
                value={tz.value}
                className="text-[#E4EEF0] focus:bg-[#1d9fa9]/20 focus:text-white"
              >
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-[#6A8E98]">
          Zona horaria en la que se evalúan los horarios de atención.
        </p>
      </div>

      {/* Schedule per day */}
      <div className="space-y-2">
        <Label className="text-[#94B3BB] text-sm">Horario de atención</Label>
        <div className="rounded-lg border border-[#1d9fa9]/15 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1d9fa9]/15 bg-[#0B1A1E]/60">
                <th className="text-left px-4 py-2.5 text-[#6A8E98] font-medium w-28">Día</th>
                <th className="text-left px-4 py-2.5 text-[#6A8E98] font-medium">Abre</th>
                <th className="text-left px-4 py-2.5 text-[#6A8E98] font-medium">Cierra</th>
                <th className="text-left px-4 py-2.5 text-[#6A8E98] font-medium">Activo</th>
              </tr>
            </thead>
            <tbody>
              {DIAS.map(({ key, label }, idx) => {
                const dia = horario.schedule[key] ?? { abre: "09:00", cierra: "18:00", activo: true };
                return (
                  <tr
                    key={key}
                    className={`border-b border-[#1d9fa9]/10 last:border-0 ${idx % 2 === 0 ? "" : "bg-[#0B1A1E]/30"} ${!dia.activo ? "opacity-50" : ""}`}
                  >
                    <td className="px-4 py-2.5">
                      <span className="text-[#94B3BB] font-medium">{label}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <Input
                        type="time"
                        value={dia.abre}
                        onChange={(e) => setDia(key, { abre: e.target.value })}
                        disabled={!dia.activo}
                        className="bg-[#0B1A1E] border-[#1d9fa9]/20 text-[#E4EEF0] focus:border-[#1d9fa9] h-8 text-sm w-32 disabled:opacity-50"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <Input
                        type="time"
                        value={dia.cierra}
                        onChange={(e) => setDia(key, { cierra: e.target.value })}
                        disabled={!dia.activo}
                        className="bg-[#0B1A1E] border-[#1d9fa9]/20 text-[#E4EEF0] focus:border-[#1d9fa9] h-8 text-sm w-32 disabled:opacity-50"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <Switch
                        checked={dia.activo}
                        onCheckedChange={(v) => setDia(key, { activo: v })}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Retry settings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Retry delays */}
        <div className="space-y-2">
          <Label className="text-[#94B3BB] text-sm">Reintentos al cliente</Label>
          <p className="text-xs text-[#6A8E98]">
            Tiempo de espera entre cada reintento de llamada al lead que no contesta.
            El orden define la secuencia (1.º, 2.º, 3.º…).
          </p>
          <div className="flex flex-wrap gap-2 min-h-[2rem]">
            {horario.client_retry_delays_min.map((m, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1d9fa9]/15 border border-[#1d9fa9]/25 text-[#1d9fa9] text-xs font-medium"
              >
                <span className="text-[#6A8E98]">{idx + 1}.º</span> {fmtDelay(m)}
                <button
                  type="button"
                  onClick={() => removeRetryDelay(idx)}
                  className="hover:text-white transition-colors ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {horario.client_retry_delays_min.length === 0 && (
              <span className="text-xs text-[#6A8E98]">Sin reintentos configurados</span>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              min={1}
              value={retryInput}
              onChange={(e) => setRetryInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRetryDelay())}
              placeholder="Ej: 2"
              className="bg-[#0B1A1E] border-[#1d9fa9]/20 text-[#E4EEF0] placeholder:text-[#6A8E98] focus:border-[#1d9fa9] h-8 text-sm w-20"
            />
            <Select value={retryUnit} onValueChange={setRetryUnit}>
              <SelectTrigger className="bg-[#0B1A1E] border-[#1d9fa9]/20 text-[#E4EEF0] focus:border-[#1d9fa9] h-8 text-sm w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0F2229] border-[#1d9fa9]/20">
                {UNIDADES.map((u) => (
                  <SelectItem key={u.value} value={u.value} className="text-[#E4EEF0] focus:bg-[#1d9fa9]/20 focus:text-white">
                    {u.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={addRetryDelay}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border border-[#1d9fa9]/30 text-[#1d9fa9] hover:bg-[#1d9fa9]/10 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar
            </button>
          </div>
          <p className="text-xs text-[#6A8E98] pt-1">
            <span className="text-[#94B3BB] font-medium">Máx. intentos al cliente: {horario.client_retry_delays_min.length}</span>
            {" "}— automático según la cantidad de reintentos. Agotados, el lead pasa a
            {horario.weekly_recontact ? " reintento semanal." : " “no contactado”."}
          </p>

          <div className="flex items-center gap-3 pt-3">
            <Switch
              checked={horario.weekly_recontact}
              onCheckedChange={(v) => setHorario((h) => (h ? { ...h, weekly_recontact: v } : h))}
            />
            <div>
              <span className="text-[#E4EEF0] text-sm">Reintento semanal indefinido</span>
              <p className="text-xs text-[#6A8E98]">
                Tras agotar los reintentos, seguir marcando 1×/semana hasta que el lead conteste.
              </p>
            </div>
          </div>
        </div>

        {/* Numeric settings + caps */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="horario-ring-timeout" className="text-[#94B3BB] text-sm">
              Tiempo de ring del asesor (seg)
            </Label>
            <Input
              id="horario-ring-timeout"
              type="number"
              min={5}
              max={120}
              value={horario.advisor_ring_timeout_sec}
              onChange={(e) =>
                setHorario((h) =>
                  h ? { ...h, advisor_ring_timeout_sec: parseInt(e.target.value, 10) || 30 } : h
                )
              }
              className="bg-[#0B1A1E] border-[#1d9fa9]/20 text-[#E4EEF0] focus:border-[#1d9fa9] w-28"
            />
            <p className="text-xs text-[#6A8E98]">
              Segundos que el asesor tiene para contestar antes de pasar al siguiente.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="horario-daily-cap" className="text-[#94B3BB] text-sm">Máx. marcaciones / día</Label>
              <Input
                id="horario-daily-cap"
                type="number"
                min={1}
                max={50}
                value={horario.daily_dial_cap}
                onChange={(e) => setHorario((h) => (h ? { ...h, daily_dial_cap: parseInt(e.target.value, 10) || 1 } : h))}
                className="bg-[#0B1A1E] border-[#1d9fa9]/20 text-[#E4EEF0] focus:border-[#1d9fa9] w-full"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="horario-weekly-cap" className="text-[#94B3BB] text-sm">Máx. marcaciones / semana</Label>
              <Input
                id="horario-weekly-cap"
                type="number"
                min={1}
                max={200}
                value={horario.weekly_dial_cap}
                onChange={(e) => setHorario((h) => (h ? { ...h, weekly_dial_cap: parseInt(e.target.value, 10) || 1 } : h))}
                className="bg-[#0B1A1E] border-[#1d9fa9]/20 text-[#E4EEF0] focus:border-[#1d9fa9] w-full"
              />
            </div>
          </div>
          <p className="text-xs text-[#6A8E98]">
            Tope de veces que se llama a un mismo lead por día y por semana, para no saturarlo
            aunque el reintento toque antes (recomendado: 6/día, 18/semana).
          </p>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-lg bg-[#1d9fa9] hover:bg-[#178893] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
