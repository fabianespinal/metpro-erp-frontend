"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { es } from "@/lib/i18n/es";
import { dt } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import ErrorBanner from "@/components/ui/ErrorBanner";
import { useCurrentRole } from "@/lib/currentRole";

interface Supplier {
  id: number;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_id: string | null;
  notes: string | null;
  is_active: boolean;
  is_dummy: boolean;
}

type Form = Omit<Supplier, "id" | "is_dummy">;
const EMPTY: Form = {
  company_name: "",
  contact_name: "",
  email: "",
  phone: "",
  address: "",
  tax_id: "",
  notes: "",
  is_active: true,
};
const t = es.sup;

const errMsg = (e: unknown) => (e instanceof Error ? e.message : "");

/** Suplidores list and form. Shown on the Clientes page when the Suplidores view is chosen. */
export default function SuppliersPanel() {
  const { isAdmin } = useCurrentRole();
  const [rows, setRows] = useState<Supplier[]>([]);
  const [form, setForm] = useState<Form>(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api.get("/suppliers");
      setRows(Array.isArray(data) ? (data as Supplier[]) : []);
      setLoadError(null);
    } catch (e) {
      setRows([]);
      setLoadError(`${t.errorCargar} ${errMsg(e)}`);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.company_name, r.contact_name, r.email, r.phone, r.tax_id].some((v) => (v ?? "").toLowerCase().includes(q)),
    );
  }, [rows, query]);

  const reset = () => {
    setForm(EMPTY);
    setEditingId(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api(editingId ? `/suppliers/${editingId}` : "/suppliers/", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      toast.success(editingId ? t.actualizado : t.creado);
      reset();
      await load();
    } catch (err) {
      toast.error(t.errorGenerico + errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const edit = (r: Supplier) => {
    setEditingId(r.id);
    setForm({
      company_name: r.company_name,
      contact_name: r.contact_name ?? "",
      email: r.email ?? "",
      phone: r.phone ?? "",
      address: r.address ?? "",
      tax_id: r.tax_id ?? "",
      notes: r.notes ?? "",
      is_active: r.is_active,
    });
  };

  const remove = async (id: number) => {
    if (!confirm(t.confirmarEliminar)) return;
    try {
      await api(`/suppliers/${id}`, { method: "DELETE" });
      toast.success(t.eliminado);
      if (editingId === id) reset();
      await load();
    } catch (err) {
      toast.error(t.errorEliminar + errMsg(err));
    }
  };

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div data-testid="suppliers-panel">
      <ErrorBanner message={loadError} onRetry={load} />

      <div className="mb-8 rounded-lg bg-surface p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">{editingId ? t.editar : t.nuevo}</h2>
        <form onSubmit={save} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input aria-label={t.empresa} placeholder={t.empresa} value={form.company_name} onChange={set("company_name")} className="rounded border p-2" required />
          <input aria-label={t.contacto} placeholder={t.contacto} value={form.contact_name ?? ""} onChange={set("contact_name")} className="rounded border p-2" />
          <input aria-label={t.correo} type="email" placeholder={t.correo} value={form.email ?? ""} onChange={set("email")} className="rounded border p-2" />
          <input aria-label={t.telefono} type="tel" placeholder={t.telefono} value={form.phone ?? ""} onChange={set("phone")} className="rounded border p-2" />
          <input aria-label={t.direccion} placeholder={t.direccion} value={form.address ?? ""} onChange={set("address")} className="rounded border p-2 md:col-span-2" />
          <input aria-label={t.rnc} placeholder={t.rnc} value={form.tax_id ?? ""} onChange={set("tax_id")} className="rounded border p-2" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            {t.activo}
          </label>
          <textarea aria-label={t.notas} placeholder={t.notas} value={form.notes ?? ""} onChange={set("notes")} className="rounded border p-2 md:col-span-2" rows={3} />
          <div className="flex gap-2 md:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? t.guardando : editingId ? t.actualizar : t.agregar}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={reset}>
                {t.cancelar}
              </Button>
            )}
          </div>
        </form>
      </div>

      <div className="overflow-x-auto rounded-lg bg-surface shadow">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
          <span className="font-bold">
            {t.lista} ({shown.length})
          </span>
          <input aria-label={t.buscar} placeholder={t.buscar} value={query} onChange={(e) => setQuery(e.target.value)} className="w-64 rounded border p-2 text-sm" />
        </div>
        {shown.length === 0 ? (
          <div className="p-8 text-center text-muted">{t.vacio}</div>
        ) : (
          <table className={dt.table}>
            <thead className={dt.thead}>
              <tr>
                <th className={dt.th}>{t.empresa}</th>
                <th className={dt.th}>{t.contacto}</th>
                <th className={dt.th}>{t.correo}</th>
                <th className={dt.th}>{t.telefono}</th>
                <th className={dt.th}>{t.rnc}</th>
                <th className={dt.th}>{t.estado}</th>
                <th className={dt.thRight}>{t.acciones}</th>
              </tr>
            </thead>
            <tbody className={dt.tbody}>
              {shown.map((r) => (
                <tr key={r.id} className={dt.tr}>
                  <td className={dt.td}>{r.company_name}</td>
                  <td className={dt.td}>{r.contact_name || "-"}</td>
                  <td className={dt.td}>{r.email || "-"}</td>
                  <td className={dt.td}>{r.phone || "-"}</td>
                  <td className={dt.td}>{r.tax_id || "-"}</td>
                  <td className={dt.td}>{r.is_active ? t.activo : t.inactivo}</td>
                  <td className={dt.tdRight}>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => edit(r)} className="rounded px-2 py-1 text-accent transition hover:bg-accent/10 hover:text-accent-strong">
                        {t.editarBtn}
                      </button>
                      {isAdmin && (
                        <button onClick={() => remove(r.id)} className="rounded px-2 py-1 text-red-600 transition hover:bg-red-50 hover:text-red-700">
                          {t.eliminar}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
