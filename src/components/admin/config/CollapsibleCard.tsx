import { useState } from "react";
import { ChevronDown, Zap, Loader2, CheckCircle2, XCircle } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { testIntegracion } from "@/lib/adminApi";

interface CollapsibleCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  clave?: string;           // for "Probar conexión"
  actualizado_en?: string;  // shown as "Actualizado: dd/mm/yy hh:mm"
  summary?: React.ReactNode; // shown in header right side (before test button)
  children: React.ReactNode;
}

export default function CollapsibleCard({
  title,
  subtitle,
  icon,
  defaultOpen = false,
  clave,
  actualizado_en,
  summary,
  children,
}: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const probar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!clave) return;
    setTesting(true);
    setResult(null);
    try {
      const r = await testIntegracion(clave);
      setResult({
        ok: r.ok,
        msg: r.ok ? r.mensaje ?? "Conexión correcta." : r.error ?? "Falló la prueba.",
      });
    } catch (err) {
      setResult({ ok: false, msg: err instanceof Error ? err.message : "Error" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#1d9fa9]/20 bg-[#0F2229] overflow-hidden">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer select-none hover:bg-[#1d9fa9]/5 transition-colors border-b border-[#1d9fa9]/15">
            {/* Left: icon + title + subtitle */}
            <div className="flex items-center gap-3 min-w-0">
              {icon && (
                <div className="flex-shrink-0 text-[#1d9fa9]">{icon}</div>
              )}
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-[#E4EEF0] leading-tight">{title}</h3>
                {subtitle && (
                  <p className="text-xs text-[#94B3BB] mt-0.5">{subtitle}</p>
                )}
              </div>
            </div>

            {/* Right: summary + test button + timestamp + chevron */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {summary && (
                <div className="text-sm text-[#94B3BB]">{summary}</div>
              )}

              {clave && (
                <button
                  type="button"
                  onClick={probar}
                  disabled={testing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#1d9fa9]/30 text-[#1d9fa9] hover:bg-[#1d9fa9]/10 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {testing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  Probar conexión
                </button>
              )}

              {actualizado_en && (
                <div className="text-xs text-[#6A8E98] whitespace-nowrap hidden sm:block">
                  Actualizado:{" "}
                  {new Date(actualizado_en).toLocaleDateString("es-US", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}

              <ChevronDown
                className={`w-4 h-4 text-[#6A8E98] transition-transform duration-200 ${
                  open ? "rotate-180" : ""
                }`}
              />
            </div>
          </div>
        </CollapsibleTrigger>

        {/* Inline test result */}
        {result && (
          <div
            className={`flex items-start gap-2 px-5 py-2.5 text-sm border-b ${
              result.ok
                ? "bg-green-500/10 text-green-400 border-green-500/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"
            }`}
          >
            {result.ok ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            )}
            <span className="break-words">{result.msg}</span>
          </div>
        )}

        <CollapsibleContent>
          <div className="px-5 py-5">{children}</div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
