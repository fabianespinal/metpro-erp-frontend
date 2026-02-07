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

  // Hide header on login page
  const isLoginPage = pathname === '/login'

  return (
    <html lang='en'>
      <body className='bg-gray-50 min-h-screen flex flex-col'>
        
        {!isLoginPage && <Header />}

        <main className={`flex-1 ${!isLoginPage ? 'pt-16' : ''}`}>
          {children}
        </main>

      </body>
    </html>
  )
}