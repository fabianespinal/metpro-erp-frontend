"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useCurrentRole } from "@/lib/currentRole";

// One /auth/policy request per page session. A failed request means "policy off": buttons stay visible and
// the backend remains the real guard (it answers 403 when the policy is on).
let cached: boolean | null = null;
let inflight: Promise<boolean> | null = null;

export function fetchRolePolicy(): Promise<boolean> {
  if (cached !== null) return Promise.resolve(cached);
  if (!inflight) {
    inflight = api
      .get("/auth/policy")
      .then((d: unknown) => {
        cached = (d as { role_policy?: unknown } | null)?.role_policy === true;
        return cached;
      })
      .catch(() => false)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** True when this user may approve, reject and convert quotes: policy off, or role admin or superadmin. */
export function useCanManageQuotes(): boolean {
  const { isAdmin } = useCurrentRole();
  const [policy, setPolicy] = useState<boolean>(cached === true);
  useEffect(() => {
    let active = true;
    fetchRolePolicy().then((p) => {
      if (active) setPolicy(p);
    });
    return () => {
      active = false;
    };
  }, []);
  return !policy || isAdmin;
}
