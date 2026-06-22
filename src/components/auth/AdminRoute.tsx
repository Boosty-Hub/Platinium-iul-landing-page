import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Status = "loading" | "anon" | "denied" | "ok";

/**
 * Gate para los paneles internos (/form-panel, /analytics).
 * La barrera REAL es RLS en la DB; este guard es solo UX:
 *  - sin sesión        -> redirige a /login
 *  - sesión no-staff   -> pantalla de acceso restringido
 *  - sesión staff      -> renderiza el panel
 * "Staff" se valida con la RPC SECDEF is_sistema_user (no con un query directo
 * a usuarios_sistema, que RLS bloquea).
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const location = useLocation();

  useEffect(() => {
    let active = true;

    const evaluate = async (session: Session | null) => {
      if (!session) {
        if (active) setStatus("anon");
        return;
      }
      const { data, error } = await (supabase as any).rpc("is_sistema_user");
      if (!active) return;
      setStatus(!error && data === true ? "ok" : "denied");
    };

    supabase.auth.getSession().then(({ data }) => evaluate(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => evaluate(session));

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (status === "loading") {
    return <div className="min-h-screen bg-[#0B1A1E]" />;
  }

  if (status === "anon") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (status === "denied") {
    return (
      <div className="min-h-screen bg-[#0B1A1E] text-white flex items-center justify-center p-6">
        <div className="max-w-sm text-center space-y-4">
          <div className="text-5xl">🔒</div>
          <h1 className="text-xl font-bold">Acceso restringido</h1>
          <p className="text-[#94B3BB] text-sm">
            Tu cuenta no tiene permisos para este panel.
          </p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="px-5 py-2.5 rounded-lg bg-[#1d9fa9] hover:bg-[#178893] text-white text-sm font-semibold transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
