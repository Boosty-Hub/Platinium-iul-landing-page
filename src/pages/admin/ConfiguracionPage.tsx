import { useCallback, useEffect, useState } from "react";
import {
  Integracion,
  Asesor,
  Horario,
  KommoMetadata,
  getIntegraciones,
  getKommoMetadata,
  listAsesores,
  getHorario,
} from "@/lib/adminApi";
import CollapsibleCard from "@/components/admin/config/CollapsibleCard";
import KommoConexion from "@/components/admin/config/KommoConexion";
import KommoMapeo from "@/components/admin/config/KommoMapeo";
import RingCentralConfig from "@/components/admin/config/RingCentralConfig";
import AsesoresConfig from "@/components/admin/config/AsesoresConfig";
import HorarioConfig from "@/components/admin/config/HorarioConfig";
import UsuariosPage from "@/pages/admin/UsuariosPage";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RefreshCw } from "lucide-react";

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

const DIAS_LABEL: Record<string, string> = {
  lunes: "Lun",
  martes: "Mar",
  miercoles: "Mié",
  jueves: "Jue",
  viernes: "Vie",
  sabado: "Sáb",
  domingo: "Dom",
};

function buildHorarioSummary(horario: Horario | null): string {
  if (!horario) return "";
  const activeDays = Object.entries(horario.schedule)
    .filter(([, v]) => v.activo)
    .map(([k]) => DIAS_LABEL[k] ?? k);
  if (activeDays.length === 0) return "Sin horario activo";
  const firstEntry = Object.values(horario.schedule).find((v) => v.activo);
  const timeRange = firstEntry ? `${firstEntry.abre}–${firstEntry.cierra}` : "";
  return `${activeDays.join("–")} ${timeRange}`.trim();
}

function buildMapeoCamposCount(kommo: Integracion | null): number {
  if (!kommo?.config?.mapeo) return 0;
  try {
    const mapeo = JSON.parse(kommo.config.mapeo) as Record<string, string>;
    return Object.values(mapeo).filter((v) => v && v !== "__none__").length;
  } catch {
    return 0;
  }
}

export default function ConfiguracionPage() {
  const [integraciones, setIntegraciones] = useState<Integracion[]>([]);
  const [asesores, setAsesores] = useState<Asesor[]>([]);
  const [horario, setHorario] = useState<Horario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Kommo metadata — shared between KommoConexion and KommoMapeo
  const [kommoMeta, setKommoMeta] = useState<KommoMetadata | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState<string | null>(null);

  const loadMeta = useCallback(() => {
    setMetaLoading(true);
    setMetaError(null);
    getKommoMetadata()
      .then((m) => {
        setKommoMeta(m);
        setMetaLoading(false);
      })
      .catch((err) => {
        setMetaError(err instanceof Error ? err.message : "Error cargando metadata");
        setMetaLoading(false);
      });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, asesorData] = await Promise.all([
        getIntegraciones(),
        listAsesores().catch(() => [] as Asesor[]),
      ]);
      setIntegraciones(data);
      setAsesores(asesorData);
      // Horario best-effort
      getHorario()
        .then((h) => setHorario(h))
        .catch(() => {});
      // Reload meta too
      loadMeta();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error cargando configuraciones");
    } finally {
      setLoading(false);
    }
  }, [loadMeta]);

  useEffect(() => {
    load();
  }, [load]);

  const getIntegracion = (clave: string): Integracion | null =>
    integraciones.find((i) => i.clave === clave) ?? null;

  const kommo = getIntegracion("kommo");
  const ringcentral = getIntegracion("ringcentral");

  const responsableEnums =
    kommoMeta?.leadFields.find((f) => f.name.toLowerCase() === "responsable")?.enums ?? [];

  const horarioSummary = buildHorarioSummary(horario);
  const mapeoCamposCount = buildMapeoCamposCount(kommo);
  const asesorActivos = asesores.filter((a) => a.activo).length;

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
          {[1, 2, 3].map((i) => (
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
        <Tabs defaultValue="ringcentral">
          <TabsList className="bg-[#0B1A1E] border border-[#1d9fa9]/20 rounded-xl p-1 h-auto">
            <TabsTrigger
              value="ringcentral"
              className="rounded-lg text-[#94B3BB] hover:text-[#E4EEF0] data-[state=active]:bg-[#1d9fa9] data-[state=active]:text-white data-[state=active]:shadow-sm transition-colors"
            >
              RingCentral
            </TabsTrigger>
            <TabsTrigger
              value="kommo"
              className="rounded-lg text-[#94B3BB] hover:text-[#E4EEF0] data-[state=active]:bg-[#1d9fa9] data-[state=active]:text-white data-[state=active]:shadow-sm transition-colors"
            >
              Kommo
            </TabsTrigger>
            <TabsTrigger
              value="sistema"
              className="rounded-lg text-[#94B3BB] hover:text-[#E4EEF0] data-[state=active]:bg-[#1d9fa9] data-[state=active]:text-white data-[state=active]:shadow-sm transition-colors"
            >
              Sistema
            </TabsTrigger>
          </TabsList>

          {/* RingCentral tab */}
          <TabsContent value="ringcentral">
            <div className="space-y-4 mt-4">
              <CollapsibleCard
                title="Conexión"
                subtitle="Credenciales RingCentral"
                clave="ringcentral"
                defaultOpen={false}
                actualizado_en={ringcentral?.actualizado_en}
                summary={
                  <div className="flex items-center gap-2">
                    <StatusBadge activo={ringcentral?.activo ?? false} />
                    <span className="text-xs text-[#6A8E98]">Producción</span>
                  </div>
                }
              >
                <RingCentralConfig data={ringcentral} onSaved={load} />
              </CollapsibleCard>

              <CollapsibleCard
                title="Asesores"
                subtitle="Equipo de llamadas"
                defaultOpen={true}
                summary={
                  asesores.length > 0
                    ? `${asesores.length} asesores · ${asesorActivos} activos`
                    : undefined
                }
              >
                <AsesoresConfig responsableEnums={responsableEnums} />
              </CollapsibleCard>

              <CollapsibleCard
                title="Horario y reintentos"
                subtitle="Ventanas de atención"
                defaultOpen={false}
                summary={horarioSummary || undefined}
              >
                <HorarioConfig />
              </CollapsibleCard>
            </div>
          </TabsContent>

          {/* Kommo tab */}
          <TabsContent value="kommo">
            <div className="space-y-4 mt-4">
              <CollapsibleCard
                title="Conexión"
                subtitle="Credenciales y pipeline Kommo"
                clave="kommo"
                defaultOpen={false}
                actualizado_en={kommo?.actualizado_en}
                summary={
                  <div className="flex items-center gap-2">
                    <StatusBadge activo={kommo?.activo ?? false} />
                    {kommo?.config?.subdominio && (
                      <span className="text-xs text-[#6A8E98] font-mono">
                        {kommo.config.subdominio}
                      </span>
                    )}
                  </div>
                }
              >
                <KommoConexion
                  data={kommo}
                  meta={kommoMeta}
                  metaLoading={metaLoading}
                  metaError={metaError}
                  onSaved={load}
                />
              </CollapsibleCard>

              <CollapsibleCard
                title="Mapeo de campos"
                subtitle="Relaciona campos del formulario con Kommo"
                defaultOpen={false}
                summary={
                  mapeoCamposCount > 0
                    ? `${mapeoCamposCount} campos mapeados`
                    : undefined
                }
              >
                <KommoMapeo
                  data={kommo}
                  meta={kommoMeta}
                  metaLoading={metaLoading}
                  metaError={metaError}
                  onSaved={load}
                />
              </CollapsibleCard>
            </div>
          </TabsContent>

          {/* Sistema tab */}
          <TabsContent value="sistema">
            <div className="mt-4">
              <UsuariosPage />
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
