import { useState, useEffect, useCallback } from "react";
import { Plus, UserX, UserCheck, RefreshCw, Loader2, AlertCircle, ShieldCheck, Headset } from "lucide-react";
import {
  listAsesorUsers,
  createUser,
  deactivateAsesorUser,
  reactivateAsesorUser,
  listAsesores,
  type AsesorUser,
  type Asesor,
  type Rol,
} from "@/lib/adminApi";

// ── CreateUserModal ──────────────────────────────────────────────────────────

interface CreateModalProps {
  asesores: Asesor[];
  linkedAsesorIds: Set<string>;
  onClose: () => void;
  onCreated: () => void;
}

function CreateUserModal({ asesores, linkedAsesorIds, onClose, onCreated }: CreateModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<Rol>("asesor");
  const [asesorId, setAsesorId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Correo y contraseña son requeridos.");
      return;
    }
    if (rol === "asesor" && !asesorId) {
      setError("Seleccioná el asesor a vincular.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createUser(email, password, rol, rol === "asesor" ? asesorId : null);
      onCreated();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Asesores libres (sin usuario ya vinculado).
  const asesoresLibres = asesores.filter((a) => a.activo && !linkedAsesorIds.has(a.id));

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0F2229] border border-[#1d9fa9]/20 rounded-xl w-full max-w-md shadow-xl">
        <div className="px-6 py-5 border-b border-[#1d9fa9]/15">
          <h2 className="text-lg font-semibold text-[#E4EEF0]">Crear usuario</h2>
          <p className="text-xs text-[#6A8E98] mt-0.5">
            El usuario podrá iniciar sesión con estas credenciales
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Rol */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#94B3BB]">Tipo de usuario</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRol("asesor")}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  rol === "asesor"
                    ? "bg-[#1d9fa9]/15 border-[#1d9fa9]/60 text-[#E4EEF0]"
                    : "bg-[#0B1A1E] border-[#1d9fa9]/20 text-[#94B3BB] hover:border-[#1d9fa9]/40"
                }`}
              >
                <Headset className="w-4 h-4" /> Asesor
              </button>
              <button
                type="button"
                onClick={() => setRol("admin")}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  rol === "admin"
                    ? "bg-[#1d9fa9]/15 border-[#1d9fa9]/60 text-[#E4EEF0]"
                    : "bg-[#0B1A1E] border-[#1d9fa9]/20 text-[#94B3BB] hover:border-[#1d9fa9]/40"
                }`}
              >
                <ShieldCheck className="w-4 h-4" /> Administrador
              </button>
            </div>
            <p className="text-[11px] text-[#6A8E98]">
              {rol === "asesor"
                ? "Recibe llamadas y ve solo sus propios leads."
                : "Acceso total: configuración, usuarios y todos los datos."}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#94B3BB]" htmlFor="email">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@ejemplo.com"
              required
              className="w-full px-3 py-2 bg-[#0B1A1E] border border-[#1d9fa9]/20 rounded-lg text-sm text-[#E4EEF0] placeholder:text-[#6A8E98] focus:outline-none focus:border-[#1d9fa9]/60 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#94B3BB]" htmlFor="password">
              Contraseña temporal
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              minLength={8}
              className="w-full px-3 py-2 bg-[#0B1A1E] border border-[#1d9fa9]/20 rounded-lg text-sm text-[#E4EEF0] placeholder:text-[#6A8E98] focus:outline-none focus:border-[#1d9fa9]/60 transition-colors"
            />
          </div>

          {rol === "asesor" && (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#94B3BB]" htmlFor="asesor">
                Asesor vinculado
              </label>
              <select
                id="asesor"
                value={asesorId}
                onChange={(e) => setAsesorId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#0B1A1E] border border-[#1d9fa9]/20 rounded-lg text-sm text-[#E4EEF0] focus:outline-none focus:border-[#1d9fa9]/60 transition-colors"
              >
                <option value="">Seleccionar asesor...</option>
                {asesoresLibres.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre} {a.rc_extension ? `(ext. ${a.rc_extension})` : ""}
                  </option>
                ))}
              </select>
              {asesoresLibres.length === 0 && (
                <p className="text-[11px] text-yellow-400/80">
                  Todos los asesores ya tienen usuario. Creá el asesor primero en Configuración → Asesores.
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-[#94B3BB] border border-[#1d9fa9]/20 hover:bg-[#1d9fa9]/10 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#1d9fa9] hover:bg-[#178893] text-white transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear usuario"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── UsuariosPage ─────────────────────────────────────────────────────────────

export default function UsuariosPage() {
  const [users, setUsers] = useState<AsesorUser[]>([]);
  const [asesores, setAsesores] = useState<Asesor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deactivating, setDeactivating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, asesoresData] = await Promise.all([
        listAsesorUsers(),
        listAsesores(),
      ]);
      setUsers(usersData);
      setAsesores(asesoresData);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDeactivate = async (user_id: string, email: string) => {
    if (!confirm(`¿Desactivar la cuenta de ${email}? El usuario no podrá iniciar sesión.`)) return;
    setDeactivating(user_id);
    try {
      await deactivateAsesorUser(user_id);
      await load();
    } catch (err) {
      alert(`Error: ${(err as Error).message}`);
    } finally {
      setDeactivating(null);
    }
  };

  const handleReactivate = async (user_id: string) => {
    setDeactivating(user_id);
    try {
      await reactivateAsesorUser(user_id);
      await load();
    } catch (err) {
      alert(`Error: ${(err as Error).message}`);
    } finally {
      setDeactivating(null);
    }
  };

  const linkedAsesorIds = new Set(users.map((u) => u.asesor_id).filter((id): id is string => !!id));

  const handleCreated = async () => {
    setShowCreate(false);
    await load();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#E4EEF0]">Usuarios del sistema</h1>
          <p className="text-sm text-[#6A8E98] mt-0.5">
            Gestiona los accesos: administradores y asesores
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="p-2 rounded-lg text-[#94B3BB] hover:text-[#E4EEF0] hover:bg-[#1d9fa9]/10 border border-[#1d9fa9]/20 transition-colors disabled:opacity-50"
            title="Recargar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#1d9fa9] hover:bg-[#178893] text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear usuario
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-start gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#0F2229] border border-[#1d9fa9]/15 rounded-xl overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-[#6A8E98] text-sm">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Cargando...
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center px-4">
            <p className="text-[#6A8E98] text-sm">No hay usuarios registrados.</p>
            <p className="text-[#6A8E98] text-xs mt-1">
              Crea el primero con el botón de arriba.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1d9fa9]/15">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#6A8E98] uppercase tracking-wider">
                    Correo
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#6A8E98] uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#6A8E98] uppercase tracking-wider">
                    Asesor vinculado
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#6A8E98] uppercase tracking-wider">
                    Ext.
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#6A8E98] uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#6A8E98] uppercase tracking-wider">
                    Creado
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1d9fa9]/10">
                {users.map((user) => (
                  <tr key={user.user_id} className="hover:bg-[#1d9fa9]/5 transition-colors">
                    <td className="px-5 py-3 text-[#E4EEF0] font-medium">
                      {user.email}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.rol === "admin"
                            ? "bg-[#1d9fa9]/15 text-[#1d9fa9]"
                            : "bg-violet-500/15 text-violet-300"
                        }`}
                      >
                        {user.rol === "admin" ? (
                          <ShieldCheck className="w-3 h-3" />
                        ) : (
                          <Headset className="w-3 h-3" />
                        )}
                        {user.rol === "admin" ? "Admin" : "Asesor"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[#94B3BB]">
                      {user.rol === "admin"
                        ? <span className="text-[#6A8E98]">—</span>
                        : user.asesores?.nombre ?? <span className="text-yellow-400/80 italic text-xs">Sin vincular</span>}
                    </td>
                    <td className="px-5 py-3 text-[#94B3BB]">
                      {user.asesores?.rc_extension ? (
                        <span className="font-mono text-[#1d9fa9]">
                          ext. {user.asesores.rc_extension}
                        </span>
                      ) : (
                        <span className="text-[#6A8E98]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.activo
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-red-500/15 text-red-400"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.activo ? "bg-emerald-400" : "bg-red-400"
                          }`}
                        />
                        {user.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[#6A8E98] text-xs">
                      {new Date(user.creado_en).toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {user.activo ? (
                        <button
                          onClick={() => handleDeactivate(user.user_id, user.email)}
                          disabled={deactivating === user.user_id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 border border-red-400/20 transition-colors disabled:opacity-50 ml-auto"
                        >
                          {deactivating === user.user_id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <UserX className="w-3 h-3" />
                          )}
                          Desactivar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivate(user.user_id)}
                          disabled={deactivating === user.user_id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 border border-emerald-400/20 transition-colors disabled:opacity-50 ml-auto"
                        >
                          {deactivating === user.user_id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <UserCheck className="w-3 h-3" />
                          )}
                          Reactivar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreateUserModal
          asesores={asesores}
          linkedAsesorIds={linkedAsesorIds}
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
