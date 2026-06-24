import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Integracion, upsertIntegracion, KommoMetadata } from "@/lib/adminApi";
import { toast } from "@/hooks/use-toast";

export interface Props {
  data: Integracion | null;
  meta: KommoMetadata | null;
  metaLoading: boolean;
  metaError: string | null;
  onSaved: () => void;
}

// Our fields to map → Kommo fields
const OUR_FIELDS: { label: string; key: string }[] = [
  { label: "Interés", key: "interes" },
  { label: "Edad (calculada)", key: "edad" },
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

const NO_MAP_VALUE = "__none__";

function fuzzyMatch(needle: string, options: { id: number; name: string; entity: string }[]) {
  const n = needle.toLowerCase().replace(/[_\s-]/g, "");
  let match = options.find((o) => o.name.toLowerCase().replace(/[_\s-]/g, "") === n);
  if (match) return match;
  match = options.find(
    (o) =>
      o.name.toLowerCase().replace(/[_\s-]/g, "").includes(n) ||
      n.includes(o.name.toLowerCase().replace(/[_\s-]/g, ""))
  );
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

export default function KommoMapeo({ data, meta, metaLoading, metaError, onSaved }: Props) {
  const cfg = data?.config ?? {};

  const [mapeo, setMapeo] = useState<Record<string, string>>(() => {
    try {
      return cfg.mapeo ? JSON.parse(cfg.mapeo) : {};
    } catch {
      return {};
    }
  });
  const [saving, setSaving] = useState(false);

  // Re-initialize mapeo when data changes (e.g., after parent reloads)
  useEffect(() => {
    try {
      const parsed = cfg.mapeo ? JSON.parse(cfg.mapeo) : {};
      setMapeo(parsed);
    } catch {
      setMapeo({});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.config?.mapeo]);

  // Auto-apply fuzzy matching when meta loads and there's no existing mapeo
  useEffect(() => {
    if (meta && !cfg.mapeo && Object.keys(mapeo).length === 0) {
      setMapeo(buildDefaultMapeo(meta));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta]);

  const allKommoFields = meta
    ? [
        ...meta.leadFields.map((f) => ({ ...f, entity: "lead" as const })),
        ...meta.contactFields.map((f) => ({ ...f, entity: "contact" as const })),
      ]
    : [];

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

  const mappedCount = Object.values(mapeo).filter((v) => v && v !== NO_MAP_VALUE).length;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertIntegracion(
        "kommo",
        "Kommo CRM",
        { mapeo: JSON.stringify(mapeo) },
        data?.activo ?? true
      );
      toast({ title: "Mapeo guardado", description: "Configuración actualizada." });
      onSaved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast({ title: "Error al guardar", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!meta && !metaLoading) {
    return (
      <div className="flex items-start gap-2 px-3 py-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>
          Metadata no disponible. Guardá la conexión primero y recarga.
          {metaError && <span className="block text-xs mt-1 text-yellow-400/70">{metaError}</span>}
        </span>
      </div>
    );
  }

  if (metaLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#0B1A1E] border border-[#1d9fa9]/15 text-[#6A8E98] text-sm">
        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0 text-[#1d9fa9]" />
        Cargando metadata de Kommo…
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <p className="text-xs text-[#6A8E98]">
        <span className="text-[#94B3BB] font-medium">{mappedCount} campos mapeados</span> de {OUR_FIELDS.length} disponibles.
        Indica a qué campo de Kommo corresponde cada dato del formulario.
      </p>

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

      <div className="pt-1">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-lg bg-[#1d9fa9] hover:bg-[#178893] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
        >
          {saving ? "Guardando…" : "Guardar mapeo"}
        </button>
      </div>
    </form>
  );
}
