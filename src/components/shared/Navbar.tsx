import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useScrollY, useScrollDirection } from "@/hooks/useScrollY";
import type { ThemeClasses } from "./theme";
import { SERVICE_PAGES } from "./data";

interface NavbarProps {
  t: ThemeClasses;
  dark: boolean;
  setDark: (v: boolean) => void;
}

const NAV_LINKS = [
  { label: "Servicios", href: "/seguro-de-vida-iul", hasDropdown: true },
  { label: "Comparativa", href: "/iul-vs-401k", hasDropdown: false },
  { label: "Contacto", href: "/contacto", hasDropdown: false },
];

export function Navbar({ t, dark, setDark }: NavbarProps) {
  const scrollY = useScrollY();
  const navVisible = useScrollDirection();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const h = () => { if (window.innerWidth > 768) setMenuOpen(false); };
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl transition-all ${
        navVisible ? "translate-y-0 duration-500 ease-out" : "-translate-y-full duration-300 ease-in"
      } ${scrollY > 50 ? `${t.nav} ${t.divider} border-b shadow-sm` : ""}`}
      role="navigation"
      aria-label="Navegación principal"
    >
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 no-underline" aria-label="Platinium Insurance Group - Inicio">
          <img src="/logo.png" alt="Platinium Insurance Group" className="h-10 w-auto object-contain" width={40} height={40} loading="eager" />
          <div className="hidden sm:block">
            <div className="text-[15px] font-bold text-[#1d9fa9] leading-none tracking-wide">PLATINIUM INSURANCE</div>
            <div className={`text-[9px] tracking-[3px] ${t.textMuted} uppercase`}>GROUP</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-7">
          {NAV_LINKS.map((l) =>
            l.hasDropdown ? (
              <div
                key={l.href}
                className="relative"
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <Link
                  to={l.href}
                  className={`${t.textMid} hover:text-[#1d9fa9] text-sm font-medium transition-colors no-underline inline-flex items-center gap-1 py-2`}
                >
                  {l.label}
                  <svg className={`w-3 h-3 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </Link>
                {dropdownOpen && (
                  <>
                    {/* Invisible bridge to prevent gap between trigger and dropdown */}
                    <div className="absolute top-full left-0 w-full h-3" />
                    <div className={`absolute top-full left-0 pt-3 z-50`}>
                      <div className={`w-64 ${dark ? "bg-[#0F2229]" : "bg-white"} border ${t.divider} rounded-xl shadow-xl p-2`}>
                        {SERVICE_PAGES.map((sp) => (
                          <Link
                            key={sp.href}
                            to={sp.href}
                            onClick={() => setDropdownOpen(false)}
                            className={`block px-4 py-2.5 text-sm ${t.textMid} no-underline rounded-lg hover:bg-[#1d9fa9]/10 hover:text-[#1d9fa9] transition-colors`}
                          >
                            {sp.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                key={l.href}
                to={l.href}
                className={`${t.textMid} hover:text-[#1d9fa9] text-sm font-medium transition-colors no-underline`}
              >
                {l.label}
              </Link>
            )
          )}
          <button
            onClick={() => setDark(!dark)}
            className={`${t.brandBg} ${t.divider} border rounded-full px-3 py-1.5 cursor-pointer flex items-center gap-1.5 transition-all hover:scale-105`}
            aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          >
            <span className="text-sm">{dark ? "☀️" : "🌙"}</span>
            <span className={`text-[11px] ${t.textMid} font-semibold`}>{dark ? "Light" : "Dark"}</span>
          </button>
          <Link
            to="/contacto"
            className="bg-gradient-to-br from-[#1d9fa9] to-[#177D85] text-white px-6 py-2.5 rounded-lg text-sm font-bold tracking-wide no-underline hover:shadow-lg hover:shadow-[#1d9fa9]/20 transition-all hover:-translate-y-0.5"
          >
            Consulta Gratis
          </Link>
        </div>

        {/* Mobile buttons */}
        <div className="flex lg:hidden items-center gap-3">
          <button onClick={() => setDark(!dark)} className={`${t.divider} border rounded-lg p-2 cursor-pointer`} aria-label={dark ? "Modo claro" : "Modo oscuro"}>
            <span className="text-base">{dark ? "☀️" : "🌙"}</span>
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex flex-col gap-[5px] p-2 bg-transparent border-none cursor-pointer"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
          >
            <span className={`w-[22px] h-[2px] bg-[#1d9fa9] transition-all ${menuOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
            <span className={`w-[22px] h-[2px] bg-[#1d9fa9] transition-all ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`w-[22px] h-[2px] bg-[#1d9fa9] transition-all ${menuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className={`lg:hidden ${t.nav} ${t.divider} border-t px-6 py-4`}>
          <Link to="/" onClick={() => setMenuOpen(false)} className={`block py-3.5 ${t.textMid} no-underline text-base ${t.divider} border-b`}>
            Inicio
          </Link>
          {SERVICE_PAGES.map((sp) => (
            <Link key={sp.href} to={sp.href} onClick={() => setMenuOpen(false)} className={`block py-3.5 ${t.textMid} no-underline text-base ${t.divider} border-b pl-4`}>
              {sp.label}
            </Link>
          ))}
          <Link to="/iul-vs-401k" onClick={() => setMenuOpen(false)} className={`block py-3.5 ${t.textMid} no-underline text-base ${t.divider} border-b`}>
            Comparativa
          </Link>
          <Link
            to="/contacto"
            onClick={() => setMenuOpen(false)}
            className="block text-center mt-4 bg-gradient-to-br from-[#1d9fa9] to-[#177D85] text-white py-3 rounded-lg font-bold no-underline"
          >
            Consulta Gratis
          </Link>
        </div>
      )}
    </nav>
  );
}
