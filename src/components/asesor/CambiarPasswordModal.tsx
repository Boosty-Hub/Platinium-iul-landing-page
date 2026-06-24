// CambiarPasswordModal — cambio de contraseña dentro de la app (sin email).
// Usa la sesión autenticada del asesor: supabase.auth.updateUser({ password }).
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, KeyRound } from "lucide-react";

export default function CambiarPasswordModal({ onClose }: { onClose: () => void }) {
  const [actual, setActual] = useState("");
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const guardar = async () => {
    setError(null);
    if (!actual) {
      setError("Ingresá tu contraseña actual.");
      return;
    }
    if (p1.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (p1 !== p2) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }
    if (p1 === actual) {
      setError("La nueva contraseña debe ser distinta a la actual.");
      return;
    }
    setSaving(true);
    // ── Re-autenticación (anti account-takeover) ──────────────────────────────
    // Verificamos la contraseña ACTUAL antes de cambiarla, para que alguien con la
    // sesión abierta (PC compartida) no pueda tomar la cuenta sin conocerla.
    const { data: sess } = await supabase.auth.getUser();
    const email = sess?.user?.email;
    if (!email) {
      setSaving(false);
      setError("No pudimos validar tu sesión. Cerrá y volvé a entrar.");
      return;
    }
    const { error: reauthErr } = await supabase.auth.signInWithPassword({ email, password: actual });
    if (reauthErr) {
      setSaving(false);
      setError("La contraseña actual no es correcta.");
      return;
    }
    const { error: err } = await supabase.auth.updateUser({ password: p1 });
    setSaving(false);
    if (err) {
      setError("No pudimos cambiar la contraseña. Probá de nuevo en un momento.");
      console.error("updateUser password:", err.message);
      return;
    }
    setOk(true);
    setTimeout(onClose, 1800);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-[#0F2229] border border-[#1d9fa9]/30 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[#1d9fa9]" />
            <h2 className="text-base font-bold text-[#E4EEF0]">Cambiar mi contraseña</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1.5 rounded-lg text-[#94B3BB] hover:text-white hover:bg-[#1d9fa9]/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {ok ? (
          <p className="text-sm text-emerald-400 py-6 text-center">
            ✅ Listo, contraseña actualizada.<br />Usala la próxima vez que entres.
          </p>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#6A8E98] uppercase tracking-wider font-semibold">Contraseña actual</label>
              <input
                type="password"
                value={actual}
                onChange={(e) => setActual(e.target.value)}
                placeholder="La que usás ahora"
                autoComplete="current-password"
                className="mt-1 w-full bg-[#0B1A1E] border border-[#1d9fa9]/30 rounded-xl px-3 py-2.5 text-sm text-[#E4EEF0] placeholder-[#6A8E98] focus:outline-none focus:border-[#1d9fa9]/60 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-[#6A8E98] uppercase tracking-wider font-semibold">Nueva contraseña</label>
              <input
                type="password"
                value={p1}
                onChange={(e) => setP1(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                className="mt-1 w-full bg-[#0B1A1E] border border-[#1d9fa9]/30 rounded-xl px-3 py-2.5 text-sm text-[#E4EEF0] placeholder-[#6A8E98] focus:outline-none focus:border-[#1d9fa9]/60 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-[#6A8E98] uppercase tracking-wider font-semibold">Repetir contraseña nueva</label>
              <input
                type="password"
                value={p2}
                onChange={(e) => setP2(e.target.value)}
                placeholder="Escribila de nuevo"
                autoComplete="new-password"
                onKeyDown={(e) => e.key === "Enter" && guardar()}
                className="mt-1 w-full bg-[#0B1A1E] border border-[#1d9fa9]/30 rounded-xl px-3 py-2.5 text-sm text-[#E4EEF0] placeholder-[#6A8E98] focus:outline-none focus:border-[#1d9fa9]/60 transition-colors"
              />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              onClick={guardar}
              disabled={saving || !actual || !p1 || !p2}
              className="w-full py-2.5 rounded-xl bg-[#1d9fa9] hover:bg-[#1d9fa9]/80 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
            >
              {saving ? "Guardando…" : "Guardar contraseña"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
