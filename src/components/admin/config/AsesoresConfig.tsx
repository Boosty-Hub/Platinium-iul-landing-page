import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check, X, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Asesor, KommoEnum, listAsesores, upsertAsesor, deleteAsesor } from "@/lib/adminApi";
import { toast } from "@/hooks/use-toast";

interface Props {
  /** Opciones del campo SELECT "Responsable" de Kommo (coinciden por nombre con las extensiones RC). */
  responsableEnums: KommoEnum[];
}

const EMPTY_ASESOR: Omit<Asesor, "id"> = {
  nombre: "",
  rc_extension: "",
  telefono: "",
  kommo_user_id: "",
  kommo_responsable_enum_id: "",
  activo: true,
  orden: 0,
};

const NONE = "__none__";

function ResponsableSelect({
  value,
  enums,
  onChange,
}: {
  value: string | null;
  enums: KommoEnum[];
  onChange: (v: string) => void;
}) {
  if (enums.length === 0) {
    return (
      <Input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="enum_id"
        className="bg-[#0B1A1E] border-[#1d9fa9]/20 text-[#E4EEF0] placeholder:text-[#6A8E98] focus:border-[#1d9fa9] h-8 text-sm"
      />
    );
  }
  return (
    <Select value={value || NONE} onValueChange={(v) => onChange(v === NONE ? "" : v)}>
      <SelectTrigger className="bg-[#0B1A1E] border-[#1d9fa9]/20 text-[#E4EEF0] focus:border-[#1d9fa9] h-8 text-xs">
        <SelectValue placeholder="Responsable…" />
      </SelectTrigger>
      <SelectContent className="bg-[#0F2229] border-[#1d9fa9]/20">
        <SelectItem value={NONE} className="text-[#6A8E98] focus:bg-[#1d9fa9]/20 focus:text-white text-xs">
          — sin asignar —
        </SelectItem>
        {enums.map((e) => (
          <SelectItem
            key={e.id}
            value={String(e.id)}
            className="text-[#E4EEF0] focus:bg-[#1d9fa9]/20 focus:text-white text-xs"
          >
            {e.value}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function AsesorRow({
  asesor,
  responsableEnums,
  onSaved,
  onDelete,
}: {
  asesor: Asesor;
  responsableEnums: KommoEnum[];
  onSaved: () => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Asesor>({ ...asesor });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      toast({ title: "Nombre requerido", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await upsertAsesor(form);
      toast({ title: "Asesor guardado" });
      setEditing(false);
      onSaved();
    } catch (err: unknown) {
      toast({
        title: "Error al guardar",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await deleteAsesor(asesor.id);
      toast({ title: "Asesor eliminado" });
      onDelete(asesor.id);
    } catch (err: unknown) {
      toast({
        title: "Error al eliminar",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setForm({ ...asesor });
    setEditing(false);
    setConfirmDelete(false);
  };

  const responsableLabel =
    responsableEnums.find((e) => String(e.id) === asesor.kommo_responsable_enum_id)?.value ?? null;

  if (!editing) {
    return (
      <tr className="border-b border-[#1d9fa9]/10 last:border-0 group hover:bg-[#1d9fa9]/5 transition-colors">
        <td className="px-4 py-3 text-[#6A8E98] w-6">
          <GripVertical className="w-4 h-4" />
        </td>
        <td className="px-4 py-3">
          <span className="text-[#E4EEF0] font-medium">{asesor.nombre}</span>
        </td>
        <td className="px-4 py-3 text-[#94B3BB] font-mono text-sm">
          {asesor.rc_extension || <span className="text-[#6A8E98]">—</span>}
        </td>
        <td className="px-4 py-3 text-[#94B3BB] text-sm">
          {responsableLabel ? (
            responsableLabel
          ) : asesor.kommo_responsable_enum_id ? (
            <span className="font-mono text-xs">{asesor.kommo_responsable_enum_id}</span>
          ) : (
            <span className="text-yellow-400/80 text-xs">sin mapear</span>
          )}
        </td>
        <td className="px-4 py-3 text-[#94B3BB] text-sm">
          {asesor.telefono || <span className="text-[#6A8E98]">—</span>}
        </td>
        <td className="px-4 py-3">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              asesor.activo
                ? "bg-green-500/15 text-green-400 border border-green-500/25"
                : "bg-[#6A8E98]/15 text-[#6A8E98] border border-[#6A8E98]/25"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${asesor.activo ? "bg-green-400" : "bg-[#6A8E98]"}`} />
            {asesor.activo ? "Activo" : "Inactivo"}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg text-[#6A8E98] hover:text-[#1d9fa9] hover:bg-[#1d9fa9]/10 transition-colors"
              title="Editar"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className={`p-1.5 rounded-lg transition-colors ${
                confirmDelete
                  ? "text-red-400 bg-red-500/10 hover:bg-red-500/20"
                  : "text-[#6A8E98] hover:text-red-400 hover:bg-red-500/10"
              }`}
              title={confirmDelete ? "¿Confirmar eliminación?" : "Eliminar"}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            {confirmDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="p-1.5 rounded-lg text-[#6A8E98] hover:text-white transition-colors"
                title="Cancelar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-[#1d9fa9]/10 last:border-0 bg-[#1d9fa9]/5">
      <td className="px-4 py-2.5 text-[#6A8E98] w-6" />
      <td className="px-4 py-2.5">
        <Input
          value={form.nombre}
          onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          placeholder="Nombre"
          className="bg-[#0B1A1E] border-[#1d9fa9]/20 text-[#E4EEF0] placeholder:text-[#6A8E98] focus:border-[#1d9fa9] h-8 text-sm"
        />
      </td>
      <td className="px-4 py-2.5">
        <Input
          value={form.rc_extension ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, rc_extension: e.target.value }))}
          placeholder="107"
          className="bg-[#0B1A1E] border-[#1d9fa9]/20 text-[#E4EEF0] placeholder:text-[#6A8E98] focus:border-[#1d9fa9] h-8 text-sm font-mono"
        />
      </td>
      <td className="px-4 py-2.5">
        <ResponsableSelect
          value={form.kommo_responsable_enum_id}
          enums={responsableEnums}
          onChange={(v) => setForm((f) => ({ ...f, kommo_responsable_enum_id: v }))}
        />
      </td>
      <td className="px-4 py-2.5">
        <Input
          value={form.telefono ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
          placeholder="+1 555..."
          className="bg-[#0B1A1E] border-[#1d9fa9]/20 text-[#E4EEF0] placeholder:text-[#6A8E98] focus:border-[#1d9fa9] h-8 text-sm"
        />
      </td>
      <td className="px-4 py-2.5">
        <Switch
          checked={form.activo}
          onCheckedChange={(v) => setForm((f) => ({ ...f, activo: v }))}
        />
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-50"
            title="Guardar"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="p-1.5 rounded-lg text-[#6A8E98] hover:text-white hover:bg-[#1d9fa9]/10 transition-colors"
            title="Cancelar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function AddRow({
  responsableEnums,
  nextOrden,
  onSaved,
  onCancel,
}: {
  responsableEnums: KommoEnum[];
  nextOrden: number;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Omit<Asesor, "id">>({
    ...EMPTY_ASESOR,
    orden: nextOrden,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      toast({ title: "Nombre requerido", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await upsertAsesor(form);
      toast({ title: "Asesor creado" });
      onSaved();
    } catch (err: unknown) {
      toast({
        title: "Error al crear",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="border-b border-[#1d9fa9]/20 bg-[#1d9fa9]/8">
      <td className="px-4 py-2.5 text-[#6A8E98] w-6" />
      <td className="px-4 py-2.5">
        <Input
          autoFocus
          value={form.nombre}
          onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          placeholder="Nombre del asesor"
          className="bg-[#0B1A1E] border-[#1d9fa9]/30 text-[#E4EEF0] placeholder:text-[#6A8E98] focus:border-[#1d9fa9] h-8 text-sm"
        />
      </td>
      <td className="px-4 py-2.5">
        <Input
          value={form.rc_extension ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, rc_extension: e.target.value }))}
          placeholder="107"
          className="bg-[#0B1A1E] border-[#1d9fa9]/30 text-[#E4EEF0] placeholder:text-[#6A8E98] focus:border-[#1d9fa9] h-8 text-sm font-mono"
        />
      </td>
      <td className="px-4 py-2.5">
        <ResponsableSelect
          value={form.kommo_responsable_enum_id}
          enums={responsableEnums}
          onChange={(v) => setForm((f) => ({ ...f, kommo_responsable_enum_id: v }))}
        />
      </td>
      <td className="px-4 py-2.5">
        <Input
          value={form.telefono ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
          placeholder="+1 555..."
          className="bg-[#0B1A1E] border-[#1d9fa9]/30 text-[#E4EEF0] placeholder:text-[#6A8E98] focus:border-[#1d9fa9] h-8 text-sm"
        />
      </td>
      <td className="px-4 py-2.5">
        <Switch
          checked={form.activo}
          onCheckedChange={(v) => setForm((f) => ({ ...f, activo: v }))}
        />
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-50"
            title="Crear"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-[#6A8E98] hover:text-white hover:bg-[#1d9fa9]/10 transition-colors"
            title="Cancelar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function AsesoresConfig({ responsableEnums }: Props) {
  const [asesores, setAsesores] = useState<Asesor[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listAsesores();
      setAsesores(data);
    } catch (err: unknown) {
      toast({
        title: "Error cargando asesores",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = (id: string) => {
    setAsesores((prev) => prev.filter((a) => a.id !== id));
  };

  const nextOrden = asesores.length > 0 ? Math.max(...asesores.map((a) => a.orden)) + 1 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-[#6A8E98]">
          El asesor que conteste se asigna automáticamente en el campo{" "}
          <span className="text-[#94B3BB]">Responsable</span> de Kommo (match por nombre RC ↔ Kommo).
          Ordená la lista por prioridad; se llama de arriba hacia abajo.
        </p>
        <button
          type="button"
          onClick={() => setAdding(true)}
          disabled={adding}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-[#1d9fa9] hover:bg-[#178893] disabled:opacity-50 text-white transition-colors whitespace-nowrap flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Agregar
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-[#0B1A1E]/60 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-[#1d9fa9]/15 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead>
                <tr className="border-b border-[#1d9fa9]/15 bg-[#0B1A1E]/60">
                  <th className="w-6 px-4 py-2.5" />
                  <th className="text-left px-4 py-2.5 text-[#6A8E98] font-medium">Nombre</th>
                  <th className="text-left px-4 py-2.5 text-[#6A8E98] font-medium">Ext. RC</th>
                  <th className="text-left px-4 py-2.5 text-[#6A8E98] font-medium">Responsable (Kommo)</th>
                  <th className="text-left px-4 py-2.5 text-[#6A8E98] font-medium">Teléfono</th>
                  <th className="text-left px-4 py-2.5 text-[#6A8E98] font-medium">Estado</th>
                  <th className="w-20 px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {adding && (
                  <AddRow
                    responsableEnums={responsableEnums}
                    nextOrden={nextOrden}
                    onSaved={() => {
                      setAdding(false);
                      load();
                    }}
                    onCancel={() => setAdding(false)}
                  />
                )}
                {asesores.length === 0 && !adding ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[#6A8E98] text-sm">
                      No hay asesores configurados. Agregá el primero.
                    </td>
                  </tr>
                ) : (
                  asesores.map((a) => (
                    <AsesorRow
                      key={a.id}
                      asesor={a}
                      responsableEnums={responsableEnums}
                      onSaved={load}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
