// EstadoBar — indicador SIEMPRE visible de si el asesor está recibiendo llamadas.
// Se monta arriba de cada página del asesor. El estado también se refleja en el
// título de la pestaña (ver AsesorSessionProvider), así se ve aunque esté en otra
// pestaña (Kommo, etc.). Resuelve: "puede que no esté recibiendo y no lo sepa".
import { useAsesorSession } from "@/components/asesor/AsesorSessionProvider";
import { AlertTriangle, Radio } from "lucide-react";

export default function EstadoBar() {
  const { ready, notReadyReason, disponible, toggleDisponible, toggling, asesorId } = useAsesorSession();

  // Mientras conecta, no mostramos nada (evita parpadeo).
  if (!asesorId) return null;

  if (ready) {
    return (
      <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm font-medium">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
        </span>
        En línea — recibiendo llamadas
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl bg-red-500/12 border border-red-500/30">
      <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-red-300">No estás recibiendo llamadas</p>
        <p className="text-xs text-red-200/80 mt-0.5">{notReadyReason}</p>
      </div>
      {!disponible && (
        <button
          onClick={toggleDisponible}
          disabled={toggling}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1d9fa9] hover:bg-[#1d9fa9]/80 text-white text-xs font-semibold whitespace-nowrap disabled:opacity-50 transition-colors"
        >
          <Radio className="w-3.5 h-3.5" /> Ponerme disponible
        </button>
      )}
    </div>
  );
}
