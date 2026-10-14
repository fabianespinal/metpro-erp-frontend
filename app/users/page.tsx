"use client";
import { unwrapEnvelope } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { dt } from "@/components/ui/data-table";
import { useEffect, useState } from "react";

type User = {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      if (!apiUrl) {
        throw new Error("API URL is not defined. Check NEXT_PUBLIC_API_URL in Vercel.");
      }

      const token = localStorage.getItem("token");

      const res = await fetch(`${apiUrl}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = unwrapEnvelope<User[]>(await res.json());
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) return <p className="text-sm text-muted">Loading users…</p>;

  return (
    <div>
      <PageHeader title="User Management" />

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
                  <button className="mr-3 text-sm font-medium text-accent hover:underline">Edit</button>
                  <button className="text-sm font-medium text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
