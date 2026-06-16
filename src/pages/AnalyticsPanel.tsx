import { Helmet } from "react-helmet-async";
import AnalyticsContent from "@/components/panel/AnalyticsContent";

export default function AnalyticsPanel() {
  return (
    <div className="min-h-screen bg-[#071318] text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Helmet>
        <title>Analytics | Platinum Insurance</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <header className="border-b border-[#1d9fa9]/15 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Platinum" className="h-8 w-auto" />
          <span className="text-sm font-bold text-[#1d9fa9] tracking-widest uppercase">Analytics</span>
        </div>
        <span className="text-xs text-[#4A8A94]">Panel interno · No indexado</span>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <AnalyticsContent />
      </div>
    </div>
  );
}
