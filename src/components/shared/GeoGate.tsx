import { useState, useEffect } from "react";

type GeoStatus = "checking" | "allowed" | "blocked";

export function GeoGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<GeoStatus>("checking");

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((data) => {
        if (data.country_code && data.country_code !== "US") {
          setStatus("blocked");
        } else {
          setStatus("allowed");
        }
      })
      .catch(() => {
        // If geo service fails, allow access
        setStatus("allowed");
      });
  }, []);

  if (status === "checking") {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#0B1A1E] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1d9fa9]/30 border-t-[#1d9fa9] rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "blocked") {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#0B1A1E]/95 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-10 max-w-lg text-center shadow-2xl">
          <div className="text-5xl mb-5">🇺🇸</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Servicio exclusivo para residentes de Estados Unidos
          </h2>
          <p className="text-gray-600 mb-3 leading-relaxed">
            Nuestros servicios de seguros de vida IUL están disponibles exclusivamente para personas que residen en Estados Unidos.
          </p>
          <p className="text-gray-500 text-sm mb-4">
            El acceso a este sitio está restringido según tu ubicación.
          </p>
          <div className="border-t border-gray-200 pt-5 mt-5">
            <p className="text-gray-500 text-xs leading-relaxed">
              Si crees que esto es un error, contáctanos:<br />
              <a href="tel:+17862000000" className="text-[#1d9fa9] font-semibold">📞 (786) 200-0000</a>
              {" · "}
              <a href="mailto:info@platiniuminsurance.com" className="text-[#1d9fa9] font-semibold">✉️ info@platiniuminsurance.com</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
