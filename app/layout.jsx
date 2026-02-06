'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Header from '@/components/header'
import './globals.css'

export default function RootLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const token = localStorage.getItem('token')   // ✅ FIXED

    if (!token && pathname !== '/login') {
      router.push('/login')
    }
  }, [router, pathname])

  const hideFullHeader = pathname === '/dashboard'

  return (
    <html lang='en'>
      <body className='bg-gray-50 min-h-screen flex flex-col'>
        
        {!hideFullHeader && <Header />}

        <main className='flex-1 pt-16 py-4'>
          {children}
        </main>

        <footer className='bg-gray-800 text-white text-center p-4 mt-auto'>
          <p className='text-sm'>
            METPRO ERP © {new Date().getFullYear()} - Sistema de Gestión Empresarial
          </p>
        </footer>

      </body>
    </html>
  )
}