/**
 * CockpitPage — Slice 1 stub (Slice 2 will add presence toggle + Realtime pop-up + RC Embeddable).
 * This placeholder allows asesor users to land on a valid route after login.
 */
export default function CockpitPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div className="text-6xl">🎯</div>
      <h1 className="text-2xl font-bold text-[#E4EEF0]">Cockpit</h1>
      <p className="text-[#94B3BB] text-sm max-w-xs">
        Próximamente — aquí verás tus llamadas entrantes, controlarás tu disponibilidad y
        accederás al softphone integrado.
      </p>
    </div>
  );
}
