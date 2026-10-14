"use client";
export const dynamic = "force-dynamic";

import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/header";
import GlobalLoader from "@/components/GlobalLoader";
import { Toaster } from "react-hot-toast";
import { usePathname } from "next/navigation";
import { isPublicPath } from "@/lib/publicRoutes";
import "./globals.css";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  // Header hidden on customer views and on the login page.
  const showHeader = !isPublicPath(pathname) && pathname !== "/login";

  return (
    <html lang="en">
      <body className="bg-canvas text-ink min-h-screen flex flex-col">

        <GlobalLoader />

        <Toaster position="top-right" />

        <AuthGuard>
          {showHeader && <Header />}

          <main className="flex-1 w-full px-4 py-6">
            {children}
          </main>
        </AuthGuard>

      </body>
    </html>
  );
}