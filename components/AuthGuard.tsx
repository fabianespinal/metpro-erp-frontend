"use client";

import { ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Route } from "next";
import { isPublicPath } from "@/lib/publicRoutes";
import { clearSession, isTokenExpired } from "@/lib/auth";

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isPublicPath(pathname)) return;

    let token = localStorage.getItem("token");

    // An expired token counts as no session: clear it so /login does not bounce back.
    if (token && isTokenExpired(token)) {
      clearSession();
      token = null;
      if (pathname !== "/login") {
        router.push("/login?expired=1" as Route);
        return;
      }
    }

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