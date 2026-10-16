"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { useCurrentRole } from "@/lib/currentRole";

// Matches the backend rule (users/models.py MIN_PASSWORD_LENGTH).
const MIN_PASSWORD_LENGTH = 8;

export default function CreateUserPage() {
  const router = useRouter();
  const { role: myRole } = useCurrentRole();

  const [form, setForm] = useState({
    username: "",
    full_name: "",
    email: "",
    password: "",
    confirm: "",
    role: "user",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.username.trim().length < 3) return setError("Username must be at least 3 characters.");
    if (!form.email.includes("@")) return setError("Enter a valid email.");
    if (form.password.length < MIN_PASSWORD_LENGTH)
      return setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    if (form.password !== form.confirm) return setError("Passwords do not match.");

    setSaving(true);
    try {
      await api.post("/users/", {
        username: form.username.trim(),
        full_name: form.full_name.trim() || null,
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      router.push("/users");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create user.");
      setSaving(false);
    }
  }

  const input = "mt-1 w-full rounded border px-3 py-2";

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="New user" subtitle="Create an account. The user signs in with this username and password." />

      <form onSubmit={submit} className="mt-6 space-y-4 rounded-lg bg-surface p-6 shadow">
        <label className="block text-sm">
          Username
          <input className={input} value={form.username} onChange={(e) => set("username", e.target.value)} autoComplete="off" required />
        </label>
        <label className="block text-sm">
          Full name
          <input className={input} value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
        </label>
        <label className="block text-sm">
          Email
          <input type="email" className={input} value={form.email} onChange={(e) => set("email", e.target.value)} required />
        </label>
        <label className="block text-sm">
          Password
          <input type="password" className={input} value={form.password} onChange={(e) => set("password", e.target.value)} autoComplete="new-password" required />
        </label>
        <label className="block text-sm">
          Confirm password
          <input type="password" className={input} value={form.confirm} onChange={(e) => set("confirm", e.target.value)} autoComplete="new-password" required />
        </label>
        <label className="block text-sm">
          Role
          <select className={input} value={form.role} onChange={(e) => set("role", e.target.value)}>
            <option value="user">user</option>
            <option value="admin">admin</option>
            {myRole === "superadmin" && <option value="superadmin">superadmin</option>}
          </select>
        </label>

        {error && (
          <p role="alert" className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Link href="/users" className="px-4 py-2 text-sm text-muted hover:underline">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-accent px-4 py-2 text-sm text-white hover:bg-accent-strong disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create user"}
          </button>
        </div>
      </form>
    </div>
  );
}
