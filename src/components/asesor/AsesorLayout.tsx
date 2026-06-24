import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getMyNombre } from "@/lib/asesorApi";
import CambiarPasswordModal from "@/components/asesor/CambiarPasswordModal";
import { Monitor, Users, Clock, LogOut, Menu, X, KeyRound } from "lucide-react";

const NAV_ITEMS = [
  { to: "cockpit", label: "Cockpit", icon: Monitor },
  { to: "mis-leads", label: "Mis Leads", icon: Users },
  { to: "historial", label: "Historial", icon: Clock },
] as const;

export default function AsesorLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [nombre, setNombre] = useState<string | null>(null);
  const [pwOpen, setPwOpen] = useState(false);
  const navigate = useNavigate();

  // Nombre de la asesora — para que vea que es SU panel.
  useEffect(() => {
    getMyNombre().then(setNombre).catch(() => {});
  }, []);
  const primerNombre = nombre?.split(" ")[0] ?? null;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const SidebarContent = ({ onClick }: { onClick?: () => void }) => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[#1d9fa9]/15">
        <img src="/logo.png" alt="Platinium" className="h-9 w-9 object-contain flex-shrink-0" />
        <div className="min-w-0">
          <div className="font-bold text-[#E4EEF0] text-sm leading-tight truncate">Platinium IUL</div>
          <div className="text-[11px] text-[#1d9fa9] truncate font-medium">{nombre ?? "Panel de asesor"}</div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#1d9fa9]/20 text-[#1d9fa9] border border-[#1d9fa9]/30"
                  : "text-[#94B3BB] hover:text-[#E4EEF0] hover:bg-[#1d9fa9]/10 border border-transparent"
              }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Account actions */}
      <div className="px-3 pb-4 border-t border-[#1d9fa9]/15 pt-3 space-y-1">
        <button
          onClick={() => {
            onClick?.();
            setPwOpen(true);
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#94B3BB] hover:text-[#E4EEF0] hover:bg-[#1d9fa9]/10 transition-colors"
        >
          <KeyRound className="w-4 h-4 flex-shrink-0" />
          Cambiar contraseña
        </button>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#94B3BB] hover:text-[#E4EEF0] hover:bg-[#1d9fa9]/10 transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Salir
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#0B1A1E] text-[#E4EEF0] flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 xl:w-60 flex-shrink-0 bg-[#0F2229] border-r border-[#1d9fa9]/20 sticky top-0 h-screen overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center gap-3 px-4 py-3 bg-[#0F2229] border-b border-[#1d9fa9]/20">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-[#94B3BB] hover:text-white hover:bg-[#1d9fa9]/10 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>
        <img src="/logo.png" alt="Platinium" className="h-7 w-7 object-contain" />
        <span className="font-bold text-[#E4EEF0] text-sm">{primerNombre ?? "Asesor"}</span>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 flex flex-col w-64 h-full bg-[#0F2229] border-r border-[#1d9fa9]/20 transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-end px-4 pt-4">
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-lg text-[#94B3BB] hover:text-white hover:bg-[#1d9fa9]/10 transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarContent onClick={() => setMobileOpen(false)} />
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col">
        <div className="lg:hidden h-14 flex-shrink-0" aria-hidden="true" />
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </div>
      </main>

      {pwOpen && <CambiarPasswordModal onClose={() => setPwOpen(false)} />}
    </div>
  );
}
