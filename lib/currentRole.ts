"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

// One /auth/me request per page session. Shared by every consumer.
// Fails closed: any error yields a null role, which is treated as not admin.
let cachedRole: string | null = null;
let inflight: Promise<string | null> | null = null;

export function clearCurrentRoleCache(): void {
  cachedRole = null;
  inflight = null;
}

export function fetchCurrentRole(): Promise<string | null> {
  if (cachedRole) return Promise.resolve(cachedRole);
  if (!inflight) {
    inflight = api
      .get("/auth/me")
      .then((me: unknown) => {
        const role = (me as { role?: unknown } | null)?.role;
        cachedRole = typeof role === "string" ? role : null;
        return cachedRole;
      })
      .catch(() => null)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function isAdminRole(role: string | null | undefined): boolean {
  // superadmin passes every admin gate. Backend require_role("admin") also accepts superadmin.
  return role === "admin" || role === "superadmin";
}

export function useCurrentRole() {
  const [role, setRole] = useState<string | null>(cachedRole);
  const [loading, setLoading] = useState<boolean>(cachedRole === null);

  useEffect(() => {
    let active = true;
    fetchCurrentRole().then((r) => {
      if (!active) return;
      setRole(r);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return { role, isAdmin: isAdminRole(role), loading };
}
