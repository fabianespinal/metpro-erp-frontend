"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token && pathname !== "/login") {
      router.push("/login");
      return;
    }

    if (token && pathname === "/login") {
      router.push("/dashboard");
      return;
    }

    if (token && pathname === "/") {
      router.push("/dashboard");
      return;
    }
  }, [router, pathname]);

  return children;
}