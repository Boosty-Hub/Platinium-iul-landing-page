// PrimerosPasos — Onboarding cálido de primera vez para el asesor.
// Se muestra solo si localStorage no tiene "asesor_onboarding_visto"="1".
// Al cerrar, guarda la marca y nunca vuelve a aparecer.
import { useState } from "react";
import { Radio, PhoneCall, ClipboardCheck, X } from "lucide-react";

const STORAGE_KEY = "asesor_onboarding_visto";

export function haVistoPrimerosPasos(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "1";
}

export default function PrimerosPasos({ onCerrar }: { onCerrar: () => void }) {
  const [saliendo, setSaliendo] = useState(false);

  const cerrar = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setSaliendo(true);
    setTimeout(onCerrar, 200);
  };

  return (
    <div
      className={`bg-[#0F2229] border border-[#1d9fa9]/30 rounded-2xl p-6 transition-opacity duration-200 ${
        saliendo ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#E4EEF0]">
            ¡Bienvenido/a! Así es tu día 👋
          </h2>
          <p className="text-xs text-[#94B3BB] mt-0.5">
            Tres pasos simples y ya estás listo/a para vender.
          </p>
        </div>
        <button
          onClick={cerrar}
          aria-label="Cerrar guía de bienvenida"
          className="flex-shrink-0 p-1.5 rounded-lg text-[#6A8E98] hover:text-[#E4EEF0] hover:bg-[#1d9fa9]/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Pasos */}
      <ol className="space-y-4">
        {/* Paso 1 */}
        <li className="flex items-start gap-4">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#1d9fa9]/15 flex items-center justify-center mt-0.5">
            <Radio className="w-4 h-4 text-[#1d9fa9]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#E4EEF0]">
              Ponete <span className="text-[#1d9fa9]">Disponible</span>
            </p>
            <p className="text-xs text-[#94B3BB] mt-0.5 leading-relaxed">
              Cuando estés listo/a para atender, activá tu disponibilidad. Así te empezamos a pasar llamadas.
            </p>
          </div>
        </li>

        {/* Paso 2 */}
        <li className="flex items-start gap-4">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#1d9fa9]/15 flex items-center justify-center mt-0.5">
            <PhoneCall className="w-4 h-4 text-[#1d9fa9]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#E4EEF0]">Atendé cuando suene</p>
            <p className="text-xs text-[#94B3BB] mt-0.5 leading-relaxed">
              Te avisamos con una alerta grande en pantalla y tu teléfono suena. Atendés y hablás con el cliente.
            </p>
          </div>
        </li>

        {/* Paso 3 */}
        <li className="flex items-start gap-4">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#1d9fa9]/15 flex items-center justify-center mt-0.5">
            <ClipboardCheck className="w-4 h-4 text-[#1d9fa9]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#E4EEF0]">Contanos cómo fue</p>
            <p className="text-xs text-[#94B3BB] mt-0.5 leading-relaxed">
              Al colgar, te aparece "¿Cómo fue la llamada?". Elegís el resultado en un toque y nosotros actualizamos todo por vos.
            </p>
          </div>
        </li>
      </ol>

      {/* Pie */}
      <div className="mt-6 pt-4 border-t border-[#1d9fa9]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-xs text-[#6A8E98]">
          ¿Dudas? Hablá con tu supervisor.
        </p>
        <button
          onClick={cerrar}
          className="px-5 py-2.5 bg-[#1d9fa9] hover:bg-[#1d9fa9]/80 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Entendido, ¡a vender!
        </button>
      </div>
    </div>
  );
}
