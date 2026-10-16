"use client";
import Link from "next/link";
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
  const { role: myRole } = useCurrentRole();
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
      setLoadError(message(err, "Failed to load users"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Admins cannot act on superadmin accounts; the backend enforces the same rule.
  const canManage = (u: User) => isSuper || u.role !== "superadmin";

  const toggleActive = async (u: User) => {
    setBusyId(u.id);
    setNotice(null);
    try {
      await api.put(`/users/${u.id}`, { is_active: !u.is_active });
      await fetchUsers();
      setNotice({ kind: "ok", text: `${u.username} ${u.is_active ? "deactivated" : "activated"}.` });
    } catch (err) {
      setNotice({ kind: "error", text: message(err, "Failed to update user") });
    } finally {
      setBusyId(null);
    }
  };

  const deleteUser = async (u: User) => {
    if (!window.confirm(`Delete user ${u.username}? This cannot be undone.`)) return;
    setBusyId(u.id);
    setNotice(null);
    try {
      await api.delete(`/users/${u.id}`);
      await fetchUsers();
      setNotice({ kind: "ok", text: `${u.username} deleted.` });
    } catch (err) {
      setNotice({ kind: "error", text: message(err, "Failed to delete user") });
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
    if (editForm.email && !editForm.email.includes("@")) return setEditError("Enter a valid email.");
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
      setEditError(message(err, "Update failed"));
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
      setResetError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }
    setResetSaving(true);
    setResetError(null);
    try {
      await api(`/users/${resetTarget.id}/reset-password`, {
        method: "PATCH",
        body: JSON.stringify({ new_password: newPassword }),
      });
      setNotice({ kind: "ok", text: `Password reset for ${resetTarget.username}.` });
      setResetTarget(null);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setResetError(message(err, "Reset failed"));
    } finally {
      setResetSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-muted">Loading users…</p>;

  const inputCls = "mt-1 w-full rounded border px-3 py-2";

  return (
    <div>
      <PageHeader
        title="User Management"
        actions={
          <Link href="/users/create" className="rounded bg-accent px-4 py-2 text-sm text-white hover:bg-accent-strong">
            New user
          </Link>
        }
      />

      {loadError && (
        <p role="alert" className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Could not load users: {loadError}
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
              <th className={dt.th}>Username</th>
              <th className={dt.th}>Full name</th>
              <th className={dt.th}>Email</th>
              <th className={dt.th}>Role</th>
              <th className={dt.th}>Active</th>
              <th className={dt.th}>Actions</th>
            </tr>
          </thead>

          <tbody className={dt.tbody}>
            {users.map((u) => (
              <tr key={u.id} className={dt.tr}>
                <td className={dt.td}>{u.username}</td>
                <td className={dt.td}>{u.full_name || "—"}</td>
                <td className={dt.td}>{u.email || "—"}</td>
                <td className={dt.td}>{u.role}</td>
                <td className={dt.td}>{u.is_active ? "Yes" : "No"}</td>
                <td className={dt.td}>
                  {canManage(u) ? (
                    <div className="flex flex-wrap gap-3">
                      <button onClick={() => openEdit(u)} className="text-sm font-medium text-accent hover:underline">
                        Edit
                      </button>
                      <button
                        onClick={() => toggleActive(u)}
                        disabled={busyId === u.id}
                        className="text-sm font-medium text-accent hover:underline disabled:opacity-50"
                      >
                        {u.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button onClick={() => openReset(u)} className="text-sm font-medium text-accent hover:underline">
                        Reset password
                      </button>
                      <button
                        onClick={() => deleteUser(u)}
                        disabled={busyId === u.id}
                        className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted">Superadmin only</span>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && !loadError && (
              <tr>
                <td className={dt.td} colSpan={6}>
                  No users.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-surface p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold">Edit {editTarget.username}</h2>
            <label className="mb-3 block text-sm">
              Full name
              <input className={inputCls} value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
            </label>
            <label className="mb-3 block text-sm">
              Email
              <input type="email" className={inputCls} value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </label>
            <label className="mb-3 block text-sm">
              Role
              <select className={inputCls} value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                <option value="user">user</option>
                <option value="admin">admin</option>
                {(isSuper || editTarget.role === "superadmin") && <option value="superadmin">superadmin</option>}
              </select>
            </label>
            {editError && <p role="alert" className="mb-3 text-sm text-red-600">{editError}</p>}
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditTarget(null)} disabled={editSaving} className="px-4 py-2 text-sm text-muted hover:underline disabled:opacity-50">
                Cancel
              </button>
              <button onClick={submitEdit} disabled={editSaving} className="rounded bg-accent px-4 py-2 text-sm text-white hover:bg-accent-strong disabled:opacity-50">
                {editSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-surface p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold">Reset password: {resetTarget.username}</h2>
            <label className="mb-3 block text-sm">
              New password
              <input type="password" autoComplete="new-password" className={inputCls} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </label>
            <label className="mb-3 block text-sm">
              Confirm password
              <input type="password" autoComplete="new-password" className={inputCls} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </label>
            {resetError && <p role="alert" className="mb-3 text-sm text-red-600">{resetError}</p>}
            <div className="flex justify-end gap-3">
              <button onClick={() => setResetTarget(null)} disabled={resetSaving} className="px-4 py-2 text-sm text-muted hover:underline disabled:opacity-50">
                Cancel
              </button>
              <button onClick={submitReset} disabled={resetSaving} className="rounded bg-accent px-4 py-2 text-sm text-white hover:bg-accent-strong disabled:opacity-50">
                {resetSaving ? "Saving…" : "Reset password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
