"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    setMounted(true);
    const storedUser = localStorage.getItem("username");
    setUsername(storedUser || "User");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    router.push("/login");
  };

  if (!mounted) return null;

  return (
    <header className="bg-gradient-to-r from-gray-900 via-gray-800 to-black shadow-lg sticky top-0 z-50 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* LEFT: Logo + Company Name */}
          <Link href="/dashboard" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="METPRO Logo"
              className="h-10 w-auto object-contain drop-shadow-lg"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <span className="text-lg font-semibold text-white">
              METPRO
            </span>
          </Link>

          {/* RIGHT: User + Logout */}
          <div className="flex items-center gap-4">

            {username && username !== "undefined" && (
              <span className="text-sm text-gray-300">
                Welcome, {username}
              </span>
            )}

            <button
              onClick={handleLogout}
              className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
            >
              Logout
            </button>

          </div>
        </div>
      </div>
    </header>
  );
}