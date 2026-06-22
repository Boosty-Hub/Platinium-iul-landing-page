import { useState } from "react";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Integracion, upsertIntegracion } from "@/lib/adminApi";
import { toast } from "@/hooks/use-toast";

interface Props {
  data: Integracion | null;
  onSaved: () => void;
}

const SECRET_KEYS = ["access_token"] as const;

type SecretKey = (typeof SECRET_KEYS)[number];

function SecretField({
  fieldKey,
  label,
  hint,
  isSet,
  value,
  onChange,
}: {
  fieldKey: string;
  label: string;
  hint?: string;
  isSet: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  const [revealing, setRevealing] = useState(!isSet);
  const [showValue, setShowValue] = useState(false);

  if (!revealing) {
    return (
      <div className="space-y-1.5">
        <Label className="text-[#94B3BB] text-sm">{label}</Label>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0B1A1E] border border-[#1d9fa9]/20 text-sm text-[#94B3BB]">
            <CheckCircle2 className="w-4 h-4 text-[#1d9fa9] flex-shrink-0" />
            <span>•••••••• configurado ✓</span>
          </div>
          <button
            type="button"
            onClick={() => setRevealing(true)}
            className="px-3 py-2 rounded-lg text-sm border border-[#1d9fa9]/30 text-[#94B3BB] hover:text-white hover:border-[#1d9fa9]/60 transition-colors whitespace-nowrap"
          >
            Cambiar
          </button>
        </div>
        {hint && <p className="text-xs text-[#6A8E98]">{hint}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={fieldKey} className="text-[#94B3BB] text-sm">{label}</Label>
      <div className="relative">
        <Input
          id={fieldKey}
          type={showValue ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isSet ? "Ingresa un nuevo valor para cambiar…" : ""}
          className="bg-[#0B1A1E] border-[#1d9fa9]/20 text-[#E4EEF0] placeholder:text-[#6A8E98] focus:border-[#1d9fa9] pr-10"
        />
        <button
          type="button"
          onClick={() => setShowValue((v) => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6A8E98] hover:text-[#94B3BB] transition-colors"
          tabIndex={-1}
        >
          {showValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {hint && <p className="text-xs text-[#6A8E98]">{hint}</p>}
    </div>
  );
}

export default function KommoConfig({ data, onSaved }: Props) {
  const cfg = data?.config ?? {};
  const secretos = data?.secretos ?? {};

  const [subdominio, setSubdominio] = useState(cfg.subdominio ?? "");
  const [accessToken, setAccessToken] = useState("");
  const [pipelineId, setPipelineId] = useState(cfg.pipeline_id ?? "");
  const [statusId, setStatusId] = useState(cfg.status_id ?? "");
  const [responsableId, setResponsableId] = useState(cfg.responsable_id ?? "");
  const [activo, setActivo] = useState(data?.activo ?? true);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const config: Record<string, string> = {
        subdominio,
        pipeline_id: pipelineId,
        status_id: statusId,
        responsable_id: responsableId,
      };
      // Only include secrets if the user typed a new value
      if (accessToken.trim()) {
        config.access_token = accessToken.trim();
      }

      await upsertIntegracion("kommo", "Kommo CRM", config, activo);
      toast({ title: "Kommo guardado", description: "Configuración actualizada." });
      onSaved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast({ title: "Error al guardar", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const secretKeys: SecretKey[] = ["access_token"];
  const secretSetMap: Record<SecretKey, boolean> = {
    access_token: secretos.access_token === true,
  };
  const secretValues: Record<SecretKey, string> = { access_token: accessToken };
  const secretSetters: Record<SecretKey, (v: string) => void> = { access_token: setAccessToken };

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="kommo-subdominio" className="text-[#94B3BB] text-sm">Subdominio</Label>
        <Input
          id="kommo-subdominio"
          type="text"
          value={subdominio}
          onChange={(e) => setSubdominio(e.target.value)}
          placeholder="boosty"
          className="bg-[#0B1A1E] border-[#1d9fa9]/20 text-[#E4EEF0] placeholder:text-[#6A8E98] focus:border-[#1d9fa9]"
        />
        <p className="text-xs text-[#6A8E98]">
          El prefijo de tu cuenta Kommo: <span className="font-mono text-[#94B3BB]">[subdominio].kommo.com</span>
        </p>
      </div>

      {secretKeys.map((key) => (
        <SecretField
          key={key}
          fieldKey={`kommo-${key}`}
          label="Access Token"
          hint='Token de larga duración de una integración privada de Kommo. Ve a Configuración → Integraciones → API Keys.'
          isSet={secretSetMap[key]}
          value={secretValues[key]}
          onChange={secretSetters[key]}
        />
      ))}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="kommo-pipeline" className="text-[#94B3BB] text-sm">Pipeline ID</Label>
          <Input
            id="kommo-pipeline"
            type="text"
            value={pipelineId}
            onChange={(e) => setPipelineId(e.target.value)}
            placeholder="123456"
            className="bg-[#0B1A1E] border-[#1d9fa9]/20 text-[#E4EEF0] placeholder:text-[#6A8E98] focus:border-[#1d9fa9]"
          />
          <p className="text-xs text-[#6A8E98]">ID del embudo donde se crean los leads.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="kommo-status" className="text-[#94B3BB] text-sm">Status ID</Label>
          <Input
            id="kommo-status"
            type="text"
            value={statusId}
            onChange={(e) => setStatusId(e.target.value)}
            placeholder="78901"
            className="bg-[#0B1A1E] border-[#1d9fa9]/20 text-[#E4EEF0] placeholder:text-[#6A8E98] focus:border-[#1d9fa9]"
          />
          <p className="text-xs text-[#6A8E98]">Etapa inicial del pipeline.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="kommo-responsable" className="text-[#94B3BB] text-sm">Responsable ID</Label>
          <Input
            id="kommo-responsable"
            type="text"
            value={responsableId}
            onChange={(e) => setResponsableId(e.target.value)}
            placeholder="456"
            className="bg-[#0B1A1E] border-[#1d9fa9]/20 text-[#E4EEF0] placeholder:text-[#6A8E98] focus:border-[#1d9fa9]"
          />
          <p className="text-xs text-[#6A8E98]">Usuario asignado por defecto.</p>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Switch
          id="kommo-activo"
          checked={activo}
          onCheckedChange={setActivo}
        />
        <Label htmlFor="kommo-activo" className="text-[#94B3BB] text-sm cursor-pointer">
          {activo ? "Integración activa" : "Integración inactiva"}
        </Label>
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
