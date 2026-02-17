"use client";
export const dynamic = "force-dynamic";

import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/header";
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen flex flex-col">

        <AuthGuard>
          <Header />

          <main className="flex-1 w-full px-4 py-6">
            {children}
          </main>
        </AuthGuard>

      </body>
    </html>
  );
}