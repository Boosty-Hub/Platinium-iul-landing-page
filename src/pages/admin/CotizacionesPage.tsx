// CotizacionesPage — admin editor for policy quotation amounts.
import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Save, TableProperties } from "lucide-react";
import { toast } from "sonner";
import {
  Cotizacion,
  CotizacionGenero,
  listCotizaciones,
  updateCotizacion,
} from "@/lib/adminApi";

// ── Types ─────────────────────────────────────────────────────────────────────

type NumericField = keyof Omit<Cotizacion, "id" | "genero" | "edad" | "monto">;

const NUMERIC_FIELDS: { key: NumericField; label: string }[] = [
  { key: "acum_10",               label: "Acum. 10 años" },
  { key: "acum_20",               label: "Acum. 20 años" },
  { key: "critica",               label: "Enfermedad Crítica" },
  { key: "cronica",               label: "Enfermedad Crónica" },
  { key: "terminal",              label: "Enfermedad Terminal" },
  { key: "alzheimer",             label: "Alzheimer" },
  { key: "beneficio_fallecimiento", label: "Beneficio Fallecimiento" },
  { key: "db_65",                 label: "DB@65" },
];

const MONTOS = [50, 100, 150, 200, 300, 400] as const;

const EDADES = Array.from({ length: 38 }, (_, i) => i + 18); // 18–55

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);
}

// ── Row editor ────────────────────────────────────────────────────────────────

interface RowEditorProps {
  row: Cotizacion;
  onSaved: () => void;
}

function RowEditor({ row, onSaved }: RowEditorProps) {
  const [draft, setDraft] = useState<Record<NumericField, string>>(() => {
    const d = {} as Record<NumericField, string>;
    NUMERIC_FIELDS.forEach(({ key }) => { d[key] = String(row[key] ?? 0); });
    return d;
  });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const handleChange = (key: NumericField, val: string) => {
    setDraft((prev) => ({ ...prev, [key]: val }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const patch = {} as Record<NumericField, number>;
      NUMERIC_FIELDS.forEach(({ key }) => {
        patch[key] = parseFloat(draft[key]) || 0;
      });
      await updateCotizacion(row.genero, row.edad, row.monto, patch);
      toast.success(`Monto $${row.monto} guardado`);
      setDirty(false);
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="border-b border-[#1d9fa9]/10 hover:bg-[#1d9fa9]/5 transition-colors group">
      {/* Monto header cell */}
      <td className="px-4 py-3 text-sm font-bold text-[#1d9fa9] whitespace-nowrap sticky left-0 bg-[#0F2229] group-hover:bg-[#1d9fa9]/5 z-10">
        {fmtMoney(row.monto)}/mes
      </td>

      {NUMERIC_FIELDS.map(({ key }) => (
        <td key={key} className="px-2 py-2">
          <input
            type="number"
            step="0.01"
            min="0"
            value={draft[key]}
            onChange={(e) => handleChange(key, e.target.value)}
            className="w-full min-w-[100px] px-2.5 py-1.5 rounded-lg bg-[#0B1A1E] border border-[#1d9fa9]/20 text-sm text-[#E4EEF0] focus:outline-none focus:border-[#1d9fa9]/60 transition-colors text-right"
          />
        </td>
      ))}

      {/* Save button */}
      <td className="px-3 py-2 text-right">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !dirty}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1d9fa9]/10 border border-[#1d9fa9]/30 text-[#1d9fa9] text-xs font-medium hover:bg-[#1d9fa9]/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </td>
    </tr>
  );
}

// ── Segmented toggle ──────────────────────────────────────────────────────────

function GeneroToggle({
  value,
  onChange,
}: {
  value: CotizacionGenero;
  onChange: (v: CotizacionGenero) => void;
}) {
  const opts: { value: CotizacionGenero; label: string }[] = [
    { value: "MASCULINO", label: "Masculino" },
    { value: "FEMENINO",  label: "Femenino" },
  ];
  return (
    <div className="inline-flex bg-[#0B1A1E] border border-[#1d9fa9]/20 rounded-xl p-1 gap-1">
      {opts.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            value === opt.value
              ? "bg-[#1d9fa9] text-white shadow-sm"
              : "text-[#94B3BB] hover:text-[#E4EEF0] hover:bg-[#1d9fa9]/10"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CotizacionesPage() {
  const [genero, setGenero] = useState<CotizacionGenero>("MASCULINO");
  const [edad, setEdad] = useState(35);
  const [rows, setRows] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listCotizaciones(genero, edad);
      setRows(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [genero, edad]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TableProperties className="w-5 h-5 text-[#1d9fa9]" />
            <h2 className="text-xl font-bold text-[#E4EEF0]">Cotizaciones</h2>
          </div>
          <p className="text-sm text-[#94B3BB]">
            Estos montos alimentan la cotización que se envía al cliente por email.
            Edita los valores y guarda fila por fila.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-[#1d9fa9]/25 text-[#94B3BB] hover:text-white hover:border-[#1d9fa9]/60 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Recargar
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 bg-[#0F2229] border border-[#1d9fa9]/20 rounded-xl px-5 py-4">
        <div className="space-y-1">
          <p className="text-xs text-[#6A8E98] font-medium uppercase tracking-wide">Género</p>
          <GeneroToggle value={genero} onChange={setGenero} />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-[#6A8E98] font-medium uppercase tracking-wide">Edad (años)</p>
          <select
            value={edad}
            onChange={(e) => setEdad(Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-[#0B1A1E] border border-[#1d9fa9]/20 text-sm text-[#E4EEF0] focus:outline-none focus:border-[#1d9fa9]/60 transition-colors cursor-pointer"
          >
            {EDADES.map((e) => (
              <option key={e} value={e}>{e} años</option>
            ))}
          </select>
        </div>
        <div className="ml-auto text-xs text-[#6A8E98]">
          {rows.length > 0 && (
            <span>
              Mostrando {rows.length} filas · {genero === "MASCULINO" ? "♂" : "♀"} {edad} años
            </span>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2">
          {MONTOS.map((m) => (
            <div key={m} className="h-14 rounded-xl bg-[#0F2229] border border-[#1d9fa9]/10 animate-pulse" />
          ))}
        </div>
      )}

      {/* Table */}
      {!loading && rows.length > 0 && (
        <div className="rounded-xl border border-[#1d9fa9]/20 bg-[#0F2229] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#1d9fa9]/20 bg-[#0B1A1E]/60">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6A8E98] uppercase tracking-wide whitespace-nowrap sticky left-0 bg-[#0B1A1E]/60 z-10">
                    Monto mensual
                  </th>
                  {NUMERIC_FIELDS.map(({ key, label }) => (
                    <th key={key} className="px-2 py-3 text-right text-xs font-semibold text-[#6A8E98] uppercase tracking-wide whitespace-nowrap min-w-[110px]">
                      {label}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-right text-xs font-semibold text-[#6A8E98] uppercase tracking-wide whitespace-nowrap">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <RowEditor key={`${row.genero}-${row.edad}-${row.monto}`} row={row} onSaved={load} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && rows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border border-[#1d9fa9]/15 bg-[#0F2229]">
          <TableProperties className="w-10 h-10 text-[#1d9fa9]/40" />
          <div className="text-center">
            <p className="text-[#E4EEF0] font-medium">Sin datos para esta combinación</p>
            <p className="text-sm text-[#6A8E98] mt-1">
              No hay filas para {genero === "MASCULINO" ? "Masculino" : "Femenino"}, {edad} años.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
