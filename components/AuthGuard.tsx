"use client";

import { ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Route } from "next";

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
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