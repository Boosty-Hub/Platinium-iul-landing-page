import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const COOKIE_KEY = "pig_cookies_accepted";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(COOKIE_KEY);
    if (!accepted) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 pointer-events-none">
      <div className="max-w-xl mx-auto pointer-events-auto rounded-2xl border border-[#1d9fa9]/15 bg-white/95 dark:bg-[#0F2229]/95 backdrop-blur-lg shadow-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 text-sm text-[#4A6B73] leading-relaxed">
          🍪 Usamos cookies para mejorar tu experiencia y mantener tus datos seguros.{" "}
          <Link to="/politica-de-privacidad" className="text-[#1d9fa9] underline underline-offset-2 hover:opacity-80">
            Política de Privacidad
          </Link>
        </div>
        <button
          onClick={accept}
          className="shrink-0 rounded-xl bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white font-semibold text-sm px-6 py-2.5 hover:opacity-90 transition-opacity"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}
