import { useEffect, useState } from "react";
import { Eye, EyeOff, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
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
import {
  Integracion,
  upsertIntegracion,
  getKommoMetadata,
  KommoMetadata,
  KommoPipelineStatus,
} from "@/lib/adminApi";
import { toast } from "@/hooks/use-toast";

interface Props {
  data: Integracion | null;
  onSaved: () => void;
}

// Our fields to map → Kommo fields
const OUR_FIELDS: { label: string; key: string }[] = [
  { label: "Interés", key: "interes" },
  { label: "Año nacimiento", key: "anio_nacimiento" },
  { label: "Ahorro semanal", key: "ahorro_semanal" },
  { label: "Género", key: "genero" },
  { label: "Ciudad", key: "city" },
  { label: "UTM Source", key: "utm_source" },
  { label: "UTM Medium", key: "utm_medium" },
  { label: "UTM Campaign", key: "utm_campaign" },
  { label: "UTM Content", key: "utm_content" },
  { label: "UTM Term", key: "utm_term" },
  { label: "gclid", key: "gclid" },
  { label: "fbclid", key: "fbclid" },
  { label: "Referrer", key: "referrer" },
];

// Fuzzy-match a name from a list; returns the first item whose name contains the needle (case-insensitive)
function fuzzyMatch(needle: string, options: { id: number; name: string; entity: string }[]) {
  const n = needle.toLowerCase().replace(/[_\s-]/g, "");
  // exact
  let match = options.find((o) => o.name.toLowerCase().replace(/[_\s-]/g, "") === n);
  if (match) return match;
  // contains
  match = options.find((o) => o.name.toLowerCase().replace(/[_\s-]/g, "").includes(n) || n.includes(o.name.toLowerCase().replace(/[_\s-]/g, "")));
  return match ?? null;
}

function buildDefaultMapeo(meta: KommoMetadata): Record<string, string> {
  const allFields = [
    ...meta.leadFields.map((f) => ({ ...f, entity: "lead" })),
    ...meta.contactFields.map((f) => ({ ...f, entity: "contact" })),
  ];
  const mapeo: Record<string, string> = {};
  for (const { label, key } of OUR_FIELDS) {
    const match = fuzzyMatch(key, allFields) ?? fuzzyMatch(label, allFields);
    if (match) {
      mapeo[key] = `${match.entity}:${match.id}`;
    }
  }
  return mapeo;
}

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

const NO_MAP_VALUE = "__none__";

export default function KommoConfig({ data, onSaved }: Props) {
  const cfg = data?.config ?? {};
  const secretos = data?.secretos ?? {};

  const [subdominio, setSubdominio] = useState(cfg.subdominio ?? "");
  const [accessToken, setAccessToken] = useState("");
  const [pipelineId, setPipelineId] = useState(cfg.pipeline_id ?? "");
  const [statusId, setStatusId] = useState(cfg.status_id ?? "");
  const [statusNoContactadoId, setStatusNoContactadoId] = useState(cfg.status_no_contactado_id ?? "");
  const [responsableId, setResponsableId] = useState(cfg.responsable_id ?? "");
  const [activo, setActivo] = useState(data?.activo ?? true);
  const [saving, setSaving] = useState(false);

  // Mapeo state: ourKey → "entity:kommoFieldId" or ""
  const [mapeo, setMapeo] = useState<Record<string, string>>(() => {
    try {
      return cfg.mapeo ? JSON.parse(cfg.mapeo) : {};
    } catch {
      return {};
    }
  });

  // Metadata state
  const [meta, setMeta] = useState<KommoMetadata | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState<string | null>(null);

  // Derived: statuses from the selected pipeline
  const selectedPipeline = meta?.pipelines.find((p) => String(p.id) === pipelineId) ?? null;
  const statuses: KommoPipelineStatus[] = selectedPipeline?.statuses ?? [];

  // All Kommo fields (lead + contact) for the mapping table
  const allKommoFields = meta
    ? [
        ...meta.leadFields.map((f) => ({ ...f, entity: "lead" as const })),
        ...meta.contactFields.map((f) => ({ ...f, entity: "contact" as const })),
      ]
    : [];

  useEffect(() => {
    let cancelled = false;
    setMetaLoading(true);
    setMetaError(null);
    getKommoMetadata()
      .then((m) => {
        if (cancelled) return;
        setMeta(m);
        // Auto-suggest mapping if no existing mapeo
        if (!cfg.mapeo && Object.keys(mapeo).length === 0) {
          setMapeo(buildDefaultMapeo(m));
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setMetaError(err instanceof Error ? err.message : "Error cargando metadata");
      })
      .finally(() => {
        if (!cancelled) setMetaLoading(false);
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When pipeline changes, reset status IDs if they don't belong to new pipeline
  const handlePipelineChange = (pid: string) => {
    setPipelineId(pid);
    const pip = meta?.pipelines.find((p) => String(p.id) === pid);
    if (pip) {
      const ids = pip.statuses.map((s) => String(s.id));
      if (!ids.includes(statusId)) setStatusId("");
      if (!ids.includes(statusNoContactadoId)) setStatusNoContactadoId("");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const config: Record<string, string> = {
        subdominio,
        pipeline_id: pipelineId,
        status_id: statusId,
        status_no_contactado_id: statusNoContactadoId,
        responsable_id: responsableId,
        mapeo: JSON.stringify(mapeo),
      };
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

  const setMapeoField = (ourKey: string, value: string) => {
    setMapeo((prev) => {
      const next = { ...prev };
      if (value === NO_MAP_VALUE) {
        delete next[ourKey];
      } else {
        next[ourKey] = value;
      }
      return next;
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {/* Subdominio */}
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
          El prefijo de tu cuenta Kommo:{" "}
          <span className="font-mono text-[#94B3BB]">[subdominio].kommo.com</span>
        </p>
      </div>

      {/* Access token (secret) */}
      <SecretField
        fieldKey="kommo-access_token"
        label="Access Token"
        hint="Token de larga duración de una integración privada de Kommo. Ve a Configuración → Integraciones → API Keys."
        isSet={secretos.access_token === true}
        value={accessToken}
        onChange={setAccessToken}
      />

      {/* Metadata loading state */}
      {metaLoading && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#0B1A1E] border border-[#1d9fa9]/15 text-[#6A8E98] text-sm">
          <Loader2 className="w-4 h-4 animate-spin flex-shrink-0 text-[#1d9fa9]" />
          Cargando metadata de Kommo…
        </div>
      )}

      {metaError && !metaLoading && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            No se pudo cargar la metadata ({metaError}). Verificá la conexión primero. Podés usar
            los campos de texto como alternativa.
          </span>
        </div>
      )}

      {/* Pipeline, etapas, responsable — dropdowns when meta available, text inputs as fallback */}
      {meta ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Pipeline */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="kommo-pipeline" className="text-[#94B3BB] text-sm">Pipeline</Label>
            <Select value={pipelineId} onValueChange={handlePipelineChange}>
              <SelectTrigger
                id="kommo-pipeline"
                className="bg-[#0B1A1E] border-[#1d9fa9]/20 text-[#E4EEF0] focus:border-[#1d9fa9]"
              >
                <SelectValue placeholder="Seleccionar pipeline…" />
              </SelectTrigger>
              <SelectContent className="bg-[#0F2229] border-[#1d9fa9]/20">
                {meta.pipelines.map((p) => (
                  <SelectItem
                    key={p.id}
                    value={String(p.id)}
                    className="text-[#E4EEF0] focus:bg-[#1d9fa9]/20 focus:text-white"
                  >
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-[#6A8E98]">Embudo donde se crean los leads.</p>
          </div>

          {/* Etapa lead nuevo */}
          <div className="space-y-1.5">
            <Label htmlFor="kommo-status" className="text-[#94B3BB] text-sm">Etapa para lead nuevo</Label>
            <Select value={statusId} onValueChange={setStatusId} disabled={!selectedPipeline}>
              <SelectTrigger
                id="kommo-status"
                className="bg-[#0B1A1E] border-[#1d9fa9]/20 text-[#E4EEF0] focus:border-[#1d9fa9] disabled:opacity-50"
              >
                <SelectValue placeholder={selectedPipeline ? "Seleccionar etapa…" : "Elegí un pipeline primero"} />
              </SelectTrigger>
              <SelectContent className="bg-[#0F2229] border-[#1d9fa9]/20">
                {statuses.map((s) => (
                  <SelectItem
                    key={s.id}
                    value={String(s.id)}
                    className="text-[#E4EEF0] focus:bg-[#1d9fa9]/20 focus:text-white"
                  >
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-[#6A8E98]">Etapa inicial al crear el lead.</p>
          </div>

          {/* Etapa no contactado */}
          <div className="space-y-1.5">
            <Label htmlFor="kommo-status-nc" className="text-[#94B3BB] text-sm">Etapa "no contactado"</Label>
            <Select value={statusNoContactadoId} onValueChange={setStatusNoContactadoId} disabled={!selectedPipeline}>
              <SelectTrigger
                id="kommo-status-nc"
                className="bg-[#0B1A1E] border-[#1d9fa9]/20 text-[#E4EEF0] focus:border-[#1d9fa9] disabled:opacity-50"
              >
                <SelectValue placeholder={selectedPipeline ? "Seleccionar etapa…" : "Elegí un pipeline primero"} />
              </SelectTrigger>
              <SelectContent className="bg-[#0F2229] border-[#1d9fa9]/20">
                {statuses.map((s) => (
                  <SelectItem
                    key={s.id}
                    value={String(s.id)}
                    className="text-[#E4EEF0] focus:bg-[#1d9fa9]/20 focus:text-white"
                  >
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-[#6A8E98]">Etapa cuando el lead no pudo ser contactado.</p>
          </div>

          {/* Responsable */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="kommo-responsable" className="text-[#94B3BB] text-sm">Responsable por defecto</Label>
            <Select value={responsableId} onValueChange={setResponsableId}>
              <SelectTrigger
                id="kommo-responsable"
                className="bg-[#0B1A1E] border-[#1d9fa9]/20 text-[#E4EEF0] focus:border-[#1d9fa9]"
              >
                <SelectValue placeholder="Seleccionar usuario…" />
              </SelectTrigger>
              <SelectContent className="bg-[#0F2229] border-[#1d9fa9]/20">
                {meta.users.map((u) => (
                  <SelectItem
                    key={u.id}
                    value={String(u.id)}
                    className="text-[#E4EEF0] focus:bg-[#1d9fa9]/20 focus:text-white"
                  >
                    {u.name}
                    {u.email ? (
                      <span className="text-[#6A8E98] ml-1.5 text-xs">({u.email})</span>
                    ) : null}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-[#6A8E98]">Usuario asignado por defecto al crear un lead.</p>
          </div>
        </div>
      ) : (
        /* Fallback text inputs when metadata not available */
        !metaLoading && (
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
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kommo-status-nc" className="text-[#94B3BB] text-sm">Status no contactado ID</Label>
              <Input
                id="kommo-status-nc"
                type="text"
                value={statusNoContactadoId}
                onChange={(e) => setStatusNoContactadoId(e.target.value)}
                placeholder="78902"
                className="bg-[#0B1A1E] border-[#1d9fa9]/20 text-[#E4EEF0] placeholder:text-[#6A8E98] focus:border-[#1d9fa9]"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-3">
              <Label htmlFor="kommo-responsable" className="text-[#94B3BB] text-sm">Responsable ID</Label>
              <Input
                id="kommo-responsable"
                type="text"
                value={responsableId}
                onChange={(e) => setResponsableId(e.target.value)}
                placeholder="456"
                className="bg-[#0B1A1E] border-[#1d9fa9]/20 text-[#E4EEF0] placeholder:text-[#6A8E98] focus:border-[#1d9fa9]"
              />
            </div>
          </div>
        )
      )}

      {/* Mapeo de campos — only shown when metadata is available */}
      {meta && (
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-[#E4EEF0]">Mapeo de campos</h4>
            <p className="text-xs text-[#6A8E98] mt-0.5">
              Indica a qué campo de Kommo corresponde cada dato del formulario.
            </p>
          </div>
          <div className="rounded-lg border border-[#1d9fa9]/15 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1d9fa9]/15 bg-[#0B1A1E]/60">
                  <th className="text-left px-4 py-2.5 text-[#6A8E98] font-medium w-1/3">Nuestro campo</th>
                  <th className="text-left px-4 py-2.5 text-[#6A8E98] font-medium">Campo en Kommo</th>
                </tr>
              </thead>
              <tbody>
                {OUR_FIELDS.map(({ label, key }, idx) => {
                  const currentVal = mapeo[key] ?? NO_MAP_VALUE;
                  return (
                    <tr
                      key={key}
                      className={`border-b border-[#1d9fa9]/10 last:border-0 ${idx % 2 === 0 ? "" : "bg-[#0B1A1E]/30"}`}
                    >
                      <td className="px-4 py-2.5 text-[#94B3BB] font-medium whitespace-nowrap">
                        {label}
                        <span className="block text-[10px] font-mono text-[#6A8E98]">{key}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <Select value={currentVal} onValueChange={(v) => setMapeoField(key, v)}>
                          <SelectTrigger className="bg-[#0B1A1E] border-[#1d9fa9]/20 text-[#E4EEF0] focus:border-[#1d9fa9] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0F2229] border-[#1d9fa9]/20">
                            <SelectItem
                              value={NO_MAP_VALUE}
                              className="text-[#6A8E98] focus:bg-[#1d9fa9]/20 focus:text-white text-xs"
                            >
                              — no mapear —
                            </SelectItem>
                            {allKommoFields.map((f) => (
                              <SelectItem
                                key={`${f.entity}:${f.id}`}
                                value={`${f.entity}:${f.id}`}
                                className="text-[#E4EEF0] focus:bg-[#1d9fa9]/20 focus:text-white text-xs"
                              >
                                {f.name}
                                <span className="text-[#6A8E98] ml-1">
                                  ({f.entity === "lead" ? "lead" : "contacto"})
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Active toggle */}
      <div className="flex items-center gap-3 pt-1">
        <Switch id="kommo-activo" checked={activo} onCheckedChange={setActivo} />
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
