"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { clearCurrentRoleCache } from "@/lib/currentRole";
import { es } from "@/lib/i18n/es";

const noopSubscribe = () => () => {};

export default function Header() {
  const router = useRouter();
  // False during SSR and hydration, true on the client. Avoids setState in an effect.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    clearCurrentRoleCache();
    router.push("/login");
  };

  if (!mounted) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* LEFT: Logo + Company Name */}
          <Link href="/dashboard" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt={es.nav.logoAlt}
              className="h-8 w-auto object-contain"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <span className="text-sm font-semibold text-ink">
              {es.nav.inicio}
            </span>
          </Link>

          {/* RIGHT: Logout */}
          <div className="flex items-center gap-4">

            <button
              onClick={handleLogout}
              className="text-sm font-medium text-muted hover:text-ink transition-colors"
            >
              {es.nav.cerrarSesion}
            </button>

          </div>
        </div>
      </div>
    </header>
  );
}