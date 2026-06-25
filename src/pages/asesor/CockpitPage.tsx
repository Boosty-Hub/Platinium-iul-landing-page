// CockpitPage — panel de estado del asesor.
//
// La "sesión viva" (softphone, presencia, Realtime, pop-up entrante, avisos) vive
// ahora en AsesorSessionProvider (montado en el layout), así sigue activa en TODAS
// las páginas y en segundo plano. Esta página solo MUESTRA el estado y deja
// ponerse Disponible / activar avisos.
import { useEffect, useState } from "react";
import { Radio, WifiOff, CheckCircle2, AlertCircle, Bell } from "lucide-react";
import { getMyNombre } from "@/lib/asesorApi";
import { useAsesorSession } from "@/components/asesor/AsesorSessionProvider";
import PrimerosPasos, { haVistoPrimerosPasos } from "@/components/asesor/PrimerosPasos";

export default function CockpitPage() {
  const {
    asesorId,
    disponible,
    toggling,
    toggleDisponible,
    presenceError,
    rcConfigurado,
    softphoneReady,
    notifPermission,
    requestNotif,
  } = useAsesorSession();

  // Nombre de la asesora — para saludarla y que vea que es SU panel.
  const [nombre, setNombre] = useState<string | null>(null);
  useEffect(() => {
    getMyNombre().then(setNombre).catch(() => {});
  }, []);
  const primerNombre = nombre?.split(" ")[0] ?? null;

  const [mostrarOnboarding, setMostrarOnboarding] = useState<boolean>(!haVistoPrimerosPasos());

  // ── Estado de cada chequeo ────────────────────────────────────────────────
  const sistemaOk = !!asesorId;
  const softphoneOk = rcConfigurado && softphoneReady === true;
  const disponibilidadOk = disponible;
  const avisosOk = notifPermission === "granted" || notifPermission === "unsupported";

  const todoListo =
    sistemaOk && disponibilidadOk && (!rcConfigurado || softphoneOk);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#E4EEF0]">
          {primerNombre ? `Hola, ${primerNombre} 👋` : "Mi Cockpit"}
        </h1>
        <p className="text-sm text-[#94B3BB] mt-1">Tu centro de llamadas</p>
      </div>

      {/* Onboarding de primera vez */}
      {mostrarOnboarding && <PrimerosPasos onCerrar={() => setMostrarOnboarding(false)} />}

      {/* Tarjeta "¿Listo para recibir llamadas?" */}
      <div className="bg-[#0F2229] border border-[#1d9fa9]/20 rounded-2xl p-6 space-y-5">
        {/* Banner de estado global */}
        {todoListo ? (
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-sm font-semibold text-emerald-300">
              Todo listo. Las llamadas suenan acá, en tu teléfono y aunque estés en otra pestaña.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <p className="text-sm font-semibold text-amber-300">
              Te falta un paso para recibir llamadas
            </p>
          </div>
        )}

        {/* Chequeo 1: Sistema */}
        <Check
          ok={sistemaOk}
          title="Sistema"
          okText="Estás conectado."
          pendingText="Conectando con el sistema…"
        />

        {/* Chequeo 2: Teléfono */}
        <div className="flex items-start gap-3">
          {!rcConfigurado ? (
            <CheckCircle2 className="w-5 h-5 text-[#6A8E98] flex-shrink-0 mt-0.5" />
          ) : softphoneOk ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className="text-sm font-semibold text-[#E4EEF0]">Tu teléfono</p>
            {!rcConfigurado ? (
              <p className="text-xs text-[#6A8E98] mt-0.5">Lo activa un administrador.</p>
            ) : softphoneOk ? (
              <p className="text-xs text-[#94B3BB] mt-0.5">
                Sesión iniciada. Tu teléfono está listo para recibir llamadas.
              </p>
            ) : (
              <p className="text-xs text-amber-300/80 mt-0.5 leading-relaxed">
                Iniciá sesión en tu teléfono: buscá el botón redondo abajo a la derecha de la pantalla, tocalo e ingresá una sola vez. Después queda listo siempre.
              </p>
            )}
          </div>
        </div>

        {/* Chequeo 3: Avisos del sistema — para que suene en otra pestaña */}
        <div className="flex items-start gap-3">
          {avisosOk ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#E4EEF0]">Avisos del sistema</p>
            {notifPermission === "granted" ? (
              <p className="text-xs text-[#94B3BB] mt-0.5">
                Activados. Te avisamos aunque estés en Kommo u otra pestaña.
              </p>
            ) : notifPermission === "unsupported" ? (
              <p className="text-xs text-[#6A8E98] mt-0.5">
                Tu navegador no soporta avisos del sistema.
              </p>
            ) : notifPermission === "denied" ? (
              <p className="text-xs text-amber-300/80 mt-0.5 leading-relaxed">
                Están bloqueados. Activálos en el candado 🔒 de la barra de direcciones → Notificaciones → Permitir, para que te suene aunque estés en otra pestaña.
              </p>
            ) : (
              <div className="mt-2">
                <p className="text-xs text-amber-300/80 mb-2 leading-relaxed">
                  Activá los avisos para que te suene aunque estés en otra pestaña (Kommo, etc.).
                </p>
                <button
                  onClick={requestNotif}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1d9fa9] hover:bg-[#1d9fa9]/80 text-white font-semibold text-sm transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  Activar avisos
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Chequeo 4: Disponibilidad — integrado con el toggle */}
        <div className="flex items-start gap-3">
          {disponibilidadOk ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#E4EEF0]">Disponibilidad</p>
            {!disponibilidadOk && (
              <p className="text-xs text-amber-300/80 mt-0.5">
                Activá "Disponible" para empezar a recibir llamadas.
              </p>
            )}

            <div className="mt-3">
              <button
                onClick={toggleDisponible}
                disabled={toggling || !asesorId}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  disponible
                    ? "bg-[#1d9fa9] hover:bg-[#1d9fa9]/80 text-white"
                    : "bg-[#0B1A1E] border border-[#1d9fa9]/40 text-[#94B3BB] hover:border-[#1d9fa9]/70 hover:text-[#E4EEF0]"
                }`}
              >
                {disponible ? (
                  <><Radio className="w-4 h-4 animate-pulse" /> Disponible</>
                ) : (
                  <><WifiOff className="w-4 h-4" /> No disponible</>
                )}
              </button>
            </div>

            {presenceError && <p className="mt-2 text-xs text-amber-300/80">{presenceError}</p>}
          </div>
        </div>

        {/* Indicador de conexión al sistema */}
        <div className="flex items-center gap-2 pt-1">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              asesorId ? "bg-emerald-400 animate-pulse" : "bg-[#6A8E98]"
            }`}
          />
          <span className="text-[11px] text-[#6A8E98]">
            {asesorId ? "Conectado al sistema" : "Conectando…"}
          </span>
        </div>
      </div>
    </div>
  );
}

function Check({
  ok,
  title,
  okText,
  pendingText,
}: {
  ok: boolean;
  title: string;
  okText: string;
  pendingText: string;
}) {
  return (
    <div className="flex items-start gap-3">
      {ok ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
      ) : (
        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
      )}
      <div>
        <p className="text-sm font-semibold text-[#E4EEF0]">{title}</p>
        <p className="text-xs text-[#94B3BB] mt-0.5">{ok ? okText : pendingText}</p>
      </div>
    </div>
  );
}
