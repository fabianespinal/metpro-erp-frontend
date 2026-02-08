'use client'
export const dynamic = "force-dynamic";

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Header from '@/components/header'
import './globals.css'

export default function RootLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const token = typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null

    if (!token && pathname !== '/login') {
      router.push('/login')
      return
    }

    if (token && pathname === '/login') {
      router.push('/dashboard')
      return
    }

    if (token && pathname === '/') {
      router.push('/dashboard')
      return
    }
  }, [router, pathname])

  const isLoginPage = pathname === '/login'

  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen flex flex-col">

        {!isLoginPage && <Header />}

        <main className={isLoginPage ? '' : 'flex-1 px-4 sm:px-6 lg:px-8 py-8'}>
          {children}
        </main>

      </body>
    </html>
  )
}