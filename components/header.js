"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardHeader() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    setMounted(true);
    const storedUser = localStorage.getItem("username");
    setUsername(storedUser || "User");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("username");
    router.push("/login");
  };

  if (!mounted) return null;

  return (
    <header className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white shadow-lg sticky top-0 z-50 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* LEFT: Logo + METPRO */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="relative h-8 w-8 md:w-10">
              <img
                src="/logo.png"
                alt="METPRO Logo"
                className="h-full w-auto object-contain"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextElementSibling.style.display = "block";
                }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs md:hidden">
                M
              </span>
            </div>

            <span className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
              METPRO
            </span>
          </Link>

          {/* RIGHT: Home + Username + Logout */}
          <div className="flex items-center gap-3">

            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-full bg-gray-700/40 hover:bg-gray-700 transition-all font-medium text-sm"
            >
              Home
            </Link>

            {username && username !== "undefined" && (
              <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 rounded-full shadow-lg">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium text-sm">{username}</span>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 px-4 py-2 rounded-full font-medium text-sm transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}