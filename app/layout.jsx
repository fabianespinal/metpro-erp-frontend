'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/header' // ✅ FIXED: Correct import path
import './globals.css'

export default function RootLayout({ children }) {
  const router = useRouter()
  
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token && window.location.pathname !== '/login') {
      router.push('/login')
    }
  }, [router])

  return (
    <html lang='en'>
      <body className='bg-gray-50 min-h-screen flex flex-col'>
        <Header />
        <main className='flex-1 pt-16 py-4'> {/* ✅ FIXED: Added pt-16 for sticky header */}
          {children}
        </main>
        <footer className='bg-gray-800 text-white text-center p-4 mt-auto'>
          <p className='text-sm'>METPRO ERP © {new Date().getFullYear()} - Sistema de Gestión Empresarial</p>
        </footer>
      </body>
    </html>
  )
}
// trigger vercel rebuild