"use client";

import { ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Route } from "next";

interface AuthGuardProps {
  children: ReactNode;
}

// Customer-facing views. Reachable without login.
// /quotes/<id>/view and /inv/<id> only. No other route is public.
const PUBLIC_PATTERNS: RegExp[] = [
  /^\/quotes\/[^/]+\/view\/?$/,
  /^\/inv\/[^/]+\/?$/,
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATTERNS.some((re) => re.test(pathname));
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isPublicPath(pathname)) return;

    const token = localStorage.getItem("token");

    if (!token && pathname !== "/login") {
      router.push("/login" as Route);
      return;
    }

    if (token && pathname === "/login") {
      router.push("/dashboard" as Route);
      return;
    }

    if (token && pathname === "/") {
      router.push("/dashboard" as Route);
      return;
    }
  }, [router, pathname]);

  return children;
}