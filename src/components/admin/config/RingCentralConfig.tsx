import { useState } from "react";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
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
import { Integracion, upsertIntegracion } from "@/lib/adminApi";
import { toast } from "@/hooks/use-toast";

interface Props {
  data: Integracion | null;
  onSaved: () => void;
}

const ENV_OPTIONS = [
  { value: "https://platform.ringcentral.com", label: "Production" },
  { value: "https://platform.devtest.ringcentral.com", label: "Sandbox" },
] as const;

type SecretKey = "client_secret" | "jwt_token";

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

export default function RingCentralConfig({ data, onSaved }: Props) {
  const cfg = data?.config ?? {};
  const secretos = data?.secretos ?? {};

  const initialEnv =
    cfg.server_url === "https://platform.devtest.ringcentral.com"
      ? "https://platform.devtest.ringcentral.com"
      : "https://platform.ringcentral.com";

  const [serverUrl, setServerUrl] = useState(initialEnv);
  const [clientId, setClientId] = useState(cfg.client_id ?? "");
  const [clientSecret, setClientSecret] = useState("");
  const [jwtToken, setJwtToken] = useState("");
  const [fromNumber, setFromNumber] = useState(cfg.from_number ?? "");
  const [activo, setActivo] = useState(data?.activo ?? true);
  const [saving, setSaving] = useState(false);

  const secretMeta: Record<SecretKey, { label: string; hint: string; isSet: boolean; value: string; setter: (v: string) => void }> = {
    client_secret: {
      label: "Client Secret",
      hint: "Client Secret de tu app en developers.ringcentral.com.",
      isSet: secretos.client_secret === true,
      value: clientSecret,
      setter: setClientSecret,
    },
    jwt_token: {
      label: "JWT Token",
      hint: "JWT generado en la consola de desarrolladores. Usado para autenticación server-to-server.",
      isSet: secretos.jwt_token === true,
      value: jwtToken,
      setter: setJwtToken,
    },
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const config: Record<string, string> = {
        server_url: serverUrl,
        client_id: clientId,
        from_number: fromNumber,
      };
      // Only include secrets if the user typed a new value
      if (clientSecret.trim()) config.client_secret = clientSecret.trim();
      if (jwtToken.trim()) config.jwt_token = jwtToken.trim();

      await upsertIntegracion("ringcentral", "RingCentral", config, activo);
      toast({ title: "RingCentral guardado", description: "Configuración actualizada." });
      onSaved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast({ title: "Error al guardar", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="rc-environment" className="text-[#94B3BB] text-sm">Entorno</Label>
        <Select value={serverUrl} onValueChange={setServerUrl}>
          <SelectTrigger
            id="rc-environment"
            className="bg-[#0B1A1E] border-[#1d9fa9]/20 text-[#E4EEF0] focus:border-[#1d9fa9]"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#0F2229] border-[#1d9fa9]/20">
            {ENV_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="text-[#E4EEF0] focus:bg-[#1d9fa9]/20 focus:text-white"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-[#6A8E98]">
          Servidor:{" "}
          <span className="font-mono text-[#94B3BB]">{serverUrl}</span>
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rc-client-id" className="text-[#94B3BB] text-sm">Client ID</Label>
        <Input
          id="rc-client-id"
          type="text"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          placeholder="AbCdEf1234..."
          className="bg-[#0B1A1E] border-[#1d9fa9]/20 text-[#E4EEF0] placeholder:text-[#6A8E98] focus:border-[#1d9fa9]"
        />
        <p className="text-xs text-[#6A8E98]">Client ID de tu aplicación en developers.ringcentral.com.</p>
      </div>

      {(["client_secret", "jwt_token"] as SecretKey[]).map((key) => {
        const meta = secretMeta[key];
        return (
          <SecretField
            key={key}
            fieldKey={`rc-${key}`}
            label={meta.label}
            hint={meta.hint}
            isSet={meta.isSet}
            value={meta.value}
            onChange={meta.setter}
          />
        );
      })}

      <div className="space-y-1.5">
        <Label htmlFor="rc-from-number" className="text-[#94B3BB] text-sm">Número de salida (from_number)</Label>
        <Input
          id="rc-from-number"
          type="text"
          value={fromNumber}
          onChange={(e) => setFromNumber(e.target.value)}
          placeholder="+12025551234"
          className="bg-[#0B1A1E] border-[#1d9fa9]/20 text-[#E4EEF0] placeholder:text-[#6A8E98] focus:border-[#1d9fa9]"
        />
        <p className="text-xs text-[#6A8E98]">
          Flujo automático (RingOut): RingCentral llama al from_number y lo conecta con el lead.
          Usa el número o extensión del agente que recibe la llamada primero.
        </p>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Switch
          id="rc-activo"
          checked={activo}
          onCheckedChange={setActivo}
        />
        <Label htmlFor="rc-activo" className="text-[#94B3BB] text-sm cursor-pointer">
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
