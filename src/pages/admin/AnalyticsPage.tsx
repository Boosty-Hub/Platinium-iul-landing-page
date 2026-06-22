import AnalyticsContent from "@/components/panel/AnalyticsContent";

export default function AnalyticsPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#E4EEF0]">Analítica web</h2>
        <p className="text-sm text-[#94B3BB] mt-1">Comportamiento de visitantes y conversión.</p>
      </div>
      <AnalyticsContent />
    </div>
  );
}
