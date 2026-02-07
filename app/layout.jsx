'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Header from '@/components/header'
import './globals.css'

export default function RootLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const token = localStorage.getItem('token')

    // Not logged in → force login
    if (!token && pathname !== '/login') {
      router.push('/login')
      return
    }

    // Logged in but trying to access login → send to dashboard
    if (token && pathname === '/login') {
      router.push('/dashboard')
      return
    }

    // Logged in and on root → send to dashboard
    if (token && pathname === '/') {
      router.push('/dashboard')
      return
    }
  }, [router, pathname])

  const isLoginPage = pathname === '/login'

  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen flex flex-col">

        {/* Minimalist header on all pages except login */}
        {!isLoginPage && <Header />}

        {/* Correct spacing so dashboard modules sit properly */}
        <main className={isLoginPage ? '' : 'flex-1 px-4 sm:px-6 lg:px-8 py-8'}>
          {children}
        </main>

      </body>
    </html>
  )
}