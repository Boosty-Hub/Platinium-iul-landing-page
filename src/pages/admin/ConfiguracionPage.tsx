import { useCallback, useEffect, useState } from "react";
import { Integracion, getIntegraciones, testIntegracion } from "@/lib/adminApi";
import KommoConfig from "@/components/admin/config/KommoConfig";
import RingCentralConfig from "@/components/admin/config/RingCentralConfig";
import { RefreshCw, Zap, Loader2, CheckCircle2, XCircle } from "lucide-react";

function StatusBadge({ activo }: { activo: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
        activo
          ? "bg-green-500/15 text-green-400 border border-green-500/25"
          : "bg-[#6A8E98]/15 text-[#6A8E98] border border-[#6A8E98]/25"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${activo ? "bg-green-400" : "bg-[#6A8E98]"}`} />
      {activo ? "Activo" : "Inactivo"}
    </span>
  );
}

function ConfigCard({
  title,
  description,
  clave,
  activo,
  actualizado_en,
  children,
}: {
  title: string;
  description: string;
  clave: string;
  activo: boolean;
  actualizado_en?: string;
  children: React.ReactNode;
}) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const probar = async () => {
    setTesting(true);
    setResult(null);
    try {
      const r = await testIntegracion(clave);
      setResult({ ok: r.ok, msg: r.ok ? r.mensaje ?? "Conexión correcta." : r.error ?? "Falló la prueba." });
    } catch (e) {
      setResult({ ok: false, msg: e instanceof Error ? e.message : "Error" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#1d9fa9]/20 bg-[#0F2229] overflow-hidden">
      <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[#1d9fa9]/15">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-base font-semibold text-[#E4EEF0]">{title}</h3>
            <StatusBadge activo={activo} />
          </div>
          <p className="text-sm text-[#94B3BB] mt-0.5">{description}</p>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={probar}
            disabled={testing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#1d9fa9]/30 text-[#1d9fa9] hover:bg-[#1d9fa9]/10 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            Probar conexión
          </button>
          {actualizado_en && (
            <div className="text-xs text-[#6A8E98] whitespace-nowrap">
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
        </div>
      </div>
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
      <div className="px-5 py-5">{children}</div>
    </div>
  );
}

export default function ConfiguracionPage() {
  const [integraciones, setIntegraciones] = useState<Integracion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getIntegraciones();
      setIntegraciones(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error cargando configuraciones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const getIntegracion = (clave: string): Integracion | null =>
    integraciones.find((i) => i.clave === clave) ?? null;

  const kommo = getIntegracion("kommo");
  const ringcentral = getIntegracion("ringcentral");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#E4EEF0]">Configuración</h2>
          <p className="text-sm text-[#94B3BB] mt-1">Integraciones y servicios externos.</p>
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

      {loading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-[#1d9fa9]/20 bg-[#0F2229] h-48 animate-pulse" />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-6">
          <ConfigCard
            title="Kommo CRM"
            description="Sincroniza leads entrantes directamente al pipeline de Kommo."
            clave="kommo"
            activo={kommo?.activo ?? false}
            actualizado_en={kommo?.actualizado_en}
          >
            <KommoConfig data={kommo} onSaved={load} />
          </ConfigCard>

          <ConfigCard
            title="RingCentral"
            description="Llamadas automáticas vía RingOut cuando llega un nuevo lead."
            clave="ringcentral"
            activo={ringcentral?.activo ?? false}
            actualizado_en={ringcentral?.actualizado_en}
          >
            <RingCentralConfig data={ringcentral} onSaved={load} />
          </ConfigCard>
        </div>
      )}
    </div>
  );
}
