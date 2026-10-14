"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { dt } from "@/components/ui/data-table";

type User = {
  id: number;
  username: string;
  email: string;
  role: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    api
      .get("/users")
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Fetch users error:", err));
  }, []);

  return (
    <div>
      <PageHeader title="Users" />

      <div className={dt.wrap}>
        <table className={dt.table}>
          <thead className={dt.thead}>
            <tr>
              <th className={dt.th}>ID</th>
              <th className={dt.th}>Username</th>
              <th className={dt.th}>Email</th>
              <th className={dt.th}>Role</th>
            </tr>
          </thead>

          <tbody className={dt.tbody}>
            {users.map((u) => (
              <tr key={u.id} className={dt.tr}>
                <td className={dt.td}>{u.id}</td>
                <td className={dt.td}>{u.username}</td>
                <td className={dt.td}>{u.email}</td>
                <td className={dt.td}>{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
