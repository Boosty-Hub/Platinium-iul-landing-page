import { useState, useEffect } from "react";

export function GeoGate({ children }: { children: React.ReactNode }) {
  const [blocked, setBlocked] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const already = sessionStorage.getItem("geo_checked");
    if (already) return;

    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((data) => {
        sessionStorage.setItem("geo_checked", "1");
        if (data.country_code && data.country_code !== "US") {
          setBlocked(true);
        }
      })
      .catch(() => {
        // If geo service fails, allow access
      });
  }, []);

  if (blocked && !dismissed) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#0B1A1E]/95 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-10 max-w-lg text-center shadow-2xl">
          <div className="text-5xl mb-5">🇺🇸</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Servicio exclusivo para residentes de Estados Unidos
          </h2>
          <p className="text-gray-600 mb-3 leading-relaxed">
            Nuestros servicios de seguros de vida IUL están disponibles exclusivamente para residentes de Estados Unidos.
          </p>
          <p className="text-gray-500 text-sm mb-7">
            Si resides en EE.UU. y estás usando VPN o te encuentras viajando, puedes continuar haciendo clic en el botón de abajo.
          </p>
          <button
            onClick={() => setDismissed(true)}
            className="bg-gradient-to-br from-[#1d9fa9] to-[#177D85] text-white px-8 py-3.5 rounded-xl font-bold text-sm cursor-pointer hover:shadow-lg transition-all"
          >
            Soy residente de EE.UU., continuar →
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
