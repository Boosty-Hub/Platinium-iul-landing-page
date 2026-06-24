// ResendConfig — Email via Resend configuration card (Sistema tab).
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

// ── Local SecretField (same pattern as RingCentralConfig) ─────────────────────

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
          placeholder={isSet ? "Ingresa un nuevo valor para cambiar…" : "re_xxxxxxxx…"}
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

// ── Main component ────────────────────────────────────────────────────────────

export default function ResendConfig({ data, onSaved }: Props) {
  const cfg = data?.config ?? {};
  const secretos = data?.secretos ?? {};

  const [apiKey, setApiKey] = useState("");
  const [fromEmail, setFromEmail] = useState(cfg.from_email ?? "");
  const [fromName, setFromName] = useState(cfg.from_name ?? "");
  const [replyTo, setReplyTo] = useState(cfg.reply_to ?? "");
  const [activo, setActivo] = useState(data?.activo ?? true);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const config: Record<string, string> = {
        from_email: fromEmail.trim(),
        from_name: fromName.trim(),
        reply_to: replyTo.trim(),
        // Preserve existing logo fields — pass them through so upsert doesn't clear them
        ...(cfg.logo_platinium ? { logo_platinium: cfg.logo_platinium } : {}),
        ...(cfg.logo_nlg ? { logo_nlg: cfg.logo_nlg } : {}),
      };
      // Only include api_key if the user typed a new value (empty → ignored by backend merge)
      if (apiKey.trim()) config.api_key = apiKey.trim();

      await upsertIntegracion("resend", "Email (Resend)", config, activo);
      toast({ title: "Resend guardado", description: "Configuración de email actualizada." });
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
      <SecretField
        fieldKey="resend-api-key"
        label="API Key"
        hint="Clave de API de Resend (re_xxxxxxxx). Obtén la tuya en resend.com/api-keys."
        isSet={secretos.api_key === true}
        value={apiKey}
        onChange={setApiKey}
      />

      <div className="space-y-1.5">
        <Label htmlFor="resend-from-email" className="text-[#94B3BB] text-sm">
          Desde (email)
        </Label>
        <Input
          id="resend-from-email"
          type="email"
          value={fromEmail}
          onChange={(e) => setFromEmail(e.target.value)}
          placeholder="cotizaciones@tudominio.com"
          className="bg-[#0B1A1E] border-[#1d9fa9]/20 text-[#E4EEF0] placeholder:text-[#6A8E98] focus:border-[#1d9fa9]"
        />
        <p className="text-xs text-[#6A8E98]">
          El dominio debe estar verificado en Resend.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="resend-from-name" className="text-[#94B3BB] text-sm">
          Nombre del remitente
        </Label>
        <Input
          id="resend-from-name"
          type="text"
          value={fromName}
          onChange={(e) => setFromName(e.target.value)}
          placeholder="Platinium IUL"
          className="bg-[#0B1A1E] border-[#1d9fa9]/20 text-[#E4EEF0] placeholder:text-[#6A8E98] focus:border-[#1d9fa9]"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="resend-reply-to" className="text-[#94B3BB] text-sm">
          Reply-To <span className="text-[#6A8E98] font-normal">(opcional)</span>
        </Label>
        <Input
          id="resend-reply-to"
          type="email"
          value={replyTo}
          onChange={(e) => setReplyTo(e.target.value)}
          placeholder="soporte@tudominio.com"
          className="bg-[#0B1A1E] border-[#1d9fa9]/20 text-[#E4EEF0] placeholder:text-[#6A8E98] focus:border-[#1d9fa9]"
        />
        <p className="text-xs text-[#6A8E98]">
          Dirección a la que responderá el cliente si contesta el email.
        </p>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Switch
          id="resend-activo"
          checked={activo}
          onCheckedChange={setActivo}
        />
        <Label htmlFor="resend-activo" className="text-[#94B3BB] text-sm cursor-pointer">
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
