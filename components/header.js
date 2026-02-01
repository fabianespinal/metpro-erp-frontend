'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Header() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [username, setUsername] = useState(null)
  const [showHeader, setShowHeader] = useState(false)

  useEffect(() => {
    // Only runs on client after mount
    setMounted(true)
    const storedUser = localStorage.getItem('username')
    setUsername(storedUser)
    setShowHeader(storedUser && window.location.pathname !== '/login')
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('username')
    router.push('/login')
  }

  // Don't render until mounted (prevents hydration mismatch)
if (!mounted || !showHeader) return null

return (
  <header className='bg-gray-900 text-white shadow-lg sticky top-0 z-50'>
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
      <div className='flex justify-between h-16 items-center'>

        {/* LEFT SECTION */}
        <div className='flex items-center gap-3'>
          <div className='text-3xl font-bold'>🏗️ METPRO</div>

          {/* Desktop Navigation */}
          <nav className='hidden md:flex items-center gap-6 ml-8'>
            <Link href='/clients' className='text-white/80 hover:text-white font-medium transition py-2 px-3 rounded hover:bg-gray-800'>Clients</Link>
            <Link href='/quotes' className='text-white/80 hover:text-white font-medium transition py-2 px-3 rounded hover:bg-gray-800'>Quotes</Link>
            <Link href='/products' className='text-white/80 hover:text-white font-medium transition py-2 px-3 rounded hover:bg-gray-800'>Products</Link>
            <Link href='/projects' className='text-white/80 hover:text-white font-medium transition py-2 px-3 rounded hover:bg-gray-800 flex items-center gap-1'>
              <span>🏗️</span> Projects
            </Link>
            <Link href='/reports' className='text-white/80 hover:text-white font-medium transition py-2 px-3 rounded hover:bg-gray-800 flex items-center gap-1'>
              <span>📊</span> Reports
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className='md:hidden flex items-center'>
            <button className='text-white/80 hover:text-white p-2'>
              <svg xmlns='http://www.w3.org/2000/svg' className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 6h16M4 12h16M4 18h16' />
              </svg>
            </button>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className='flex items-center gap-4'>
          <span className='bg-blue-600 px-3 py-1 rounded-full text-sm font-medium'>
            👤 {username}
          </span>

          <button 
            onClick={handleLogout}
            className='bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 shadow-md hover:shadow-lg'
          >
            <span>👋</span> Logout
          </button>
        </div>

      </div>
    </div>
  </header>
)
}