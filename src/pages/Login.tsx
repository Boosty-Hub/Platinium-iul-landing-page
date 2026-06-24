import { useEffect, useState, type FormEvent } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Resuelve la pantalla de inicio según el rol del usuario.
async function resolveLanding(): Promise<string | null> {
  const { data: isAdmin } = await (supabase as any).rpc("is_admin");
  if (isAdmin === true) return "/admin/leads";
  const { data: isAsesor } = await (supabase as any).rpc("is_asesor");
  if (isAsesor === true) return "/asesor/cockpit";
  return null; // sin rol del sistema
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Si ya hay sesión, redirigir según rol (admin → /admin, asesor → /asesor).
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const dest = await resolveLanding();
      if (dest) navigate(dest, { replace: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) {
      setLoading(false);
      setError("Credenciales inválidas. Verificá email y contraseña.");
      return;
    }
    const dest = await resolveLanding();
    setLoading(false);
    if (dest) {
      navigate(dest, { replace: true });
    } else {
      await supabase.auth.signOut();
      setError("Tu cuenta no tiene acceso al sistema.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1A1E] text-white flex items-center justify-center p-6">
      <Helmet>
        <title>Acceso · Platinium</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl border border-[#1d9fa9]/20 bg-[#0F2229] p-8 space-y-5"
      >
        <div className="text-center space-y-2">
          <img src="/logo.png" alt="Platinium" className="h-12 w-12 object-contain mx-auto" />
          <h1 className="text-xl font-bold">Panel interno</h1>
          <p className="text-sm text-[#94B3BB]">Acceso solo para staff autorizado.</p>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="email" className="block text-xs text-[#94B3BB] mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-[#0B1A1E] border border-[#1d9fa9]/25 px-3 py-2.5 text-sm outline-none focus:border-[#1d9fa9] transition-colors"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs text-[#94B3BB] mb-1">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-[#0B1A1E] border border-[#1d9fa9]/25 px-3 py-2.5 text-sm outline-none focus:border-[#1d9fa9] transition-colors"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-[#1d9fa9] hover:bg-[#178893] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
