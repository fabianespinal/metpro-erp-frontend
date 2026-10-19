"use client";
import { es } from "@/lib/i18n/es";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { dt } from "@/components/ui/data-table";
import { useCurrentRole } from "@/lib/currentRole";
import { useEffect, useState } from "react";

type User = {
  id: string;
  username: string;
  email: string | null;
  full_name: string | null;
  role: string;
  is_active: boolean;
};

// Matches the backend rule (users/models.py MIN_PASSWORD_LENGTH).
const MIN_PASSWORD_LENGTH = 8;

function message(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export default function UsersPage() {
  const { role: myRole, isAdmin, loading: roleLoading } = useCurrentRole();
  const isSuper = myRole === "superadmin";

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Reset password modal
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSaving, setResetSaving] = useState(false);

  // Edit modal
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", email: "", role: "user" });
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await api.get("/users/");
      setUsers(Array.isArray(data) ? (data as User[]) : []);
      setLoadError(null);
    } catch (err) {
      setLoadError(message(err, es.usr.errorCargar));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Usuario never calls the admin-only endpoint; the page shows a no-access notice instead.
    if (roleLoading) return;
    if (isAdmin) fetchUsers();
    else setLoading(false);
  }, [roleLoading, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  // Admins cannot act on superadmin accounts; the backend enforces the same rule.
  const canManage = (u: User) => isSuper || u.role !== "superadmin";

  const toggleActive = async (u: User) => {
    setBusyId(u.id);
    setNotice(null);
    try {
      await api.put(`/users/${u.id}`, { is_active: !u.is_active });
      await fetchUsers();
      setNotice({ kind: "ok", text: es.usr.estadoCambiado(u.username, u.is_active) });
    } catch (err) {
      setNotice({ kind: "error", text: message(err, es.usr.errorActualizar) });
    } finally {
      setBusyId(null);
    }
  };

  const deleteUser = async (u: User) => {
    if (!window.confirm(es.usr.confirmarEliminar(u.username))) return;
    setBusyId(u.id);
    setNotice(null);
    try {
      await api.delete(`/users/${u.id}`);
      await fetchUsers();
      setNotice({ kind: "ok", text: `${u.username} deleted.` });
    } catch (err) {
      setNotice({ kind: "error", text: message(err, es.usr.errorEliminar) });
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (u: User) => {
    setEditTarget(u);
    setEditForm({ full_name: u.full_name ?? "", email: u.email ?? "", role: u.role });
    setEditError(null);
  };

  const submitEdit = async () => {
    if (!editTarget) return;
    if (editForm.email && !editForm.email.includes("@")) return setEditError(es.usr.correoInvalido);
    setEditSaving(true);
    setEditError(null);
    try {
      const body: Record<string, string> = { full_name: editForm.full_name.trim() };
      if (editForm.email.trim()) body.email = editForm.email.trim();
      if (editForm.role !== editTarget.role) body.role = editForm.role;
      await api.put(`/users/${editTarget.id}`, body);
      setNotice({ kind: "ok", text: `${editTarget.username} updated.` });
      setEditTarget(null);
      await fetchUsers();
    } catch (err) {
      setEditError(message(err, es.usr.errorActualizacion));
    } finally {
      setEditSaving(false);
    }
  };

  const openReset = (u: User) => {
    setResetTarget(u);
    setNewPassword("");
    setConfirmPassword("");
    setResetError(null);
  };

  const submitReset = async () => {
    if (!resetTarget) return;
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setResetError(es.usr.claveCorta(MIN_PASSWORD_LENGTH));
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError(es.usr.clavesNoCoinciden);
      return;
    }
    setResetSaving(true);
    setResetError(null);
    try {
      await api(`/users/${resetTarget.id}/reset-password`, {
        method: "PATCH",
        body: JSON.stringify({ new_password: newPassword }),
      });
      setNotice({ kind: "ok", text: es.usr.claveRestablecida(resetTarget.username) });
      setResetTarget(null);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setResetError(message(err, es.usr.errorRestablecer));
    } finally {
      setResetSaving(false);
    }
  };

  if (!roleLoading && !isAdmin) return <div><h1 className="sr-only">Usuarios</h1><p className="text-sm text-muted">{es.usr.sinAcceso}</p></div>;
  if (loading) return <p className="text-sm text-muted">{es.usr.cargando}</p>;

  const inputCls = "mt-1 w-full rounded border px-3 py-2";

  return (
    <div>
      <PageHeader
        title={es.usr.titulo}
        actions={
          <Button asChild>
            <Link href="/users/create">{es.usr.nuevoUsuario}</Link>
          </Button>
        }
      />

      {loadError && (
        <p role="alert" className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {es.usr.noCargo}{loadError}
        </p>
      )}
      {notice && (
        <p
          role={notice.kind === "error" ? "alert" : "status"}
          className={`mb-4 rounded border p-3 text-sm ${
            notice.kind === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-line bg-canvas text-muted"
          }`}
        >
          {notice.text}
        </p>
      )}

      <div className={dt.wrap}>
        <table className={dt.table}>
          <thead className={dt.thead}>
            <tr>
              <th className={dt.th}>{es.usr.colUsuario}</th>
              <th className={dt.th}>{es.usr.colNombre}</th>
              <th className={dt.th}>{es.usr.colCorreo}</th>
              <th className={dt.th}>{es.usr.colRol}</th>
              <th className={dt.th}>{es.usr.colActivo}</th>
              <th className={dt.th}>{es.usr.colAcciones}</th>
            </tr>
          </thead>

          <tbody className={dt.tbody}>
            {users.map((u) => (
              <tr key={u.id} className={dt.tr}>
                <td className={dt.td}>{u.username}</td>
                <td className={dt.td}>{u.full_name || "—"}</td>
                <td className={dt.td}>{u.email || "—"}</td>
                <td className={dt.td}>{es.usr.roles[u.role] ?? u.role}</td>
                <td className={dt.td}>{u.is_active ? es.usr.si : es.usr.no}</td>
                <td className={dt.td}>
                  {canManage(u) ? (
                    <div className="flex flex-wrap gap-3">
                      <button onClick={() => openEdit(u)} className="text-sm font-medium text-accent hover:underline">
                        {es.usr.editar}
                      </button>
                      <button
                        onClick={() => toggleActive(u)}
                        disabled={busyId === u.id}
                        className="text-sm font-medium text-accent hover:underline disabled:opacity-50"
                      >
                        {u.is_active ? es.usr.desactivar : es.usr.activar}
                      </button>
                      <button onClick={() => openReset(u)} className="text-sm font-medium text-accent hover:underline">
                        {es.usr.restablecer}
                      </button>
                      <button
                        onClick={() => deleteUser(u)}
                        disabled={busyId === u.id}
                        className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                      >
                        {es.usr.eliminar}
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted">{es.usr.soloSuperadmin}</span>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && !loadError && (
              <tr>
                <td className={dt.td} colSpan={6}>
                  {es.usr.sinUsuarios}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-surface p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold">{es.usr.editarA(editTarget.username)}</h2>
            <label className="mb-3 block text-sm">
              {es.usr.nombre}
              <input className={inputCls} value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
            </label>
            <label className="mb-3 block text-sm">
              {es.usr.correo}
              <input type="email" className={inputCls} value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </label>
            <label className="mb-3 block text-sm">
              {es.usr.rol}
              <select className={inputCls} value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                <option value="user">{es.usr.roles.user}</option>
                <option value="admin">{es.usr.roles.admin}</option>
                {(isSuper || editTarget.role === "superadmin") && <option value="superadmin">{es.usr.roles.superadmin}</option>}
              </select>
            </label>
            {editError && <p role="alert" className="mb-3 text-sm text-red-600">{editError}</p>}
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditTarget(null)} disabled={editSaving} className="px-4 py-2 text-sm text-muted hover:underline disabled:opacity-50">
                {es.usr.cancelar}
              </button>
              <button onClick={submitEdit} disabled={editSaving} className="rounded bg-accent px-4 py-2 text-sm text-white hover:bg-accent-strong disabled:opacity-50">
                {editSaving ? es.usr.guardando : es.usr.guardar}
              </button>
            </div>
          </div>
        </div>
      )}

      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-surface p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold">{es.usr.restablecerA(resetTarget.username)}</h2>
            <label className="mb-3 block text-sm">
              {es.usr.nuevaClave}
              <input type="password" autoComplete="new-password" className={inputCls} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </label>
            <label className="mb-3 block text-sm">
              {es.usr.confirmarClave}
              <input type="password" autoComplete="new-password" className={inputCls} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </label>
            {resetError && <p role="alert" className="mb-3 text-sm text-red-600">{resetError}</p>}
            <div className="flex justify-end gap-3">
              <button onClick={() => setResetTarget(null)} disabled={resetSaving} className="px-4 py-2 text-sm text-muted hover:underline disabled:opacity-50">
                {es.usr.cancelar}
              </button>
              <button onClick={submitReset} disabled={resetSaving} className="rounded bg-accent px-4 py-2 text-sm text-white hover:bg-accent-strong disabled:opacity-50">
                {resetSaving ? es.usr.guardando : es.usr.restablecer}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
