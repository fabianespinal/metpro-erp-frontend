"use client";
import { unwrapEnvelope } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { dt } from "@/components/ui/data-table";
import { useEffect, useState } from "react";

type User = {
  id: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
};

// Frontend-only rule. The backend sets no minimum length. Confirm with owner.
const MIN_PASSWORD_LENGTH = 8;

function apiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error("API URL is not defined. Check NEXT_PUBLIC_API_URL in Vercel.");
  }
  return url;
}

function authHeaders(json = false): Record<string, string> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

async function errorMessage(res: Response): Promise<string> {
  const body = await res.json().catch(() => null);
  return (
    body?.message ||
    body?.detail ||
    body?.error?.message ||
    `Request failed (${res.status})`
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSaving, setResetSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${apiUrl()}/users`, { headers: authHeaders() });
      if (!res.ok) throw new Error(await errorMessage(res));
      setUsers(unwrapEnvelope<User[]>(await res.json()));
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleActive = async (u: User) => {
    setBusyId(u.id);
    setNotice(null);
    try {
      const res = await fetch(`${apiUrl()}/users/${u.id}`, {
        method: "PUT",
        headers: authHeaders(true),
        body: JSON.stringify({ is_active: !u.is_active }),
      });
      if (!res.ok) throw new Error(await errorMessage(res));
      await fetchUsers();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setBusyId(null);
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
      const res = await fetch(`${apiUrl()}/users/${resetTarget.id}/reset-password`, {
        method: "PATCH",
        headers: authHeaders(true),
        body: JSON.stringify({ new_password: newPassword }),
      });
      if (!res.ok) throw new Error(await errorMessage(res));
      setNotice(`Password reset for ${resetTarget.username}.`);
      setResetTarget(null);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setResetSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-muted">Loading users…</p>;

  return (
    <div>
      <PageHeader title="User Management" />

      {notice && <p className="mb-4 text-sm text-muted">{notice}</p>}

      <div className={dt.wrap}>
        <table className={dt.table}>
          <thead className={dt.thead}>
            <tr>
              <th className={dt.th}>ID</th>
              <th className={dt.th}>Username</th>
              <th className={dt.th}>Email</th>
              <th className={dt.th}>Role</th>
              <th className={dt.th}>Active</th>
              <th className={dt.th}>Actions</th>
            </tr>
          </thead>

          <tbody className={dt.tbody}>
            {users.map((u) => (
              <tr key={u.id} className={dt.tr}>
                <td className={dt.td}>{u.id}</td>
                <td className={dt.td}>{u.username}</td>
                <td className={dt.td}>{u.email}</td>
                <td className={dt.td}>{u.role}</td>
                <td className={dt.td}>{u.is_active ? "Yes" : "No"}</td>
                <td className={dt.td}>
                  <div className="flex flex-wrap gap-3">
                    <button className="text-sm font-medium text-accent hover:underline">Edit</button>
                    <button
                      onClick={() => toggleActive(u)}
                      disabled={busyId === u.id}
                      className="text-sm font-medium text-accent hover:underline disabled:opacity-50"
                    >
                      {u.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => openReset(u)}
                      className="text-sm font-medium text-accent hover:underline"
                    >
                      Reset password
                    </button>
                    <button className="text-sm font-medium text-red-600 hover:underline">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-surface p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold">
              Reset password: {resetTarget.username}
            </h2>

            <label className="mb-3 block text-sm">
              New password
              <input
                type="password"
                autoComplete="new-password"
                className="mt-1 w-full rounded border px-3 py-2"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </label>

            <label className="mb-3 block text-sm">
              Confirm password
              <input
                type="password"
                autoComplete="new-password"
                className="mt-1 w-full rounded border px-3 py-2"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>

            {resetError && <p className="mb-3 text-sm text-red-600">{resetError}</p>}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setResetTarget(null)}
                disabled={resetSaving}
                className="px-4 py-2 text-sm text-muted hover:underline disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submitReset}
                disabled={resetSaving}
                className="rounded bg-accent px-4 py-2 text-sm text-white hover:bg-accent-strong disabled:opacity-50"
              >
                {resetSaving ? "Saving…" : "Reset password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
