/**
 * HistorialPage — Slice 1 stub.
 * Slice 2 will implement the full call history table via asesorApi.getMyHistory().
 * Slice 3 will add recording playback.
 */
export default function HistorialPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div className="text-6xl">📞</div>
      <h1 className="text-2xl font-bold text-[#E4EEF0]">Historial de Llamadas</h1>
      <p className="text-[#94B3BB] text-sm max-w-xs">
        Próximamente — aquí verás tu historial de llamadas con tiempos, resultados y grabaciones.
      </p>
    </div>
  );
}
