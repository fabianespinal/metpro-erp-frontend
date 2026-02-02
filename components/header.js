'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Header() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [username, setUsername] = useState(null)
  const [showHeader, setShowHeader] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
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

  if (!mounted || !showHeader) return null

  return (
    <>
      <header className='bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white shadow-xl sticky top-0 z-50 border-b border-gray-700'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>

            {/* LEFT SECTION - Logo + Desktop Nav */}
            <div className='flex items-center gap-8'>
              {/* Logo */}
              <Link href='/clients' className='flex items-center gap-3 group'>
                <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-white text-xl transition-transform group-hover:scale-110 shadow-lg'>
                  M
                </div>
                <div className='text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent'>
                  METPRO
                </div>
              </Link>

              {/* Desktop Navigation */}
              <nav className='hidden lg:flex items-center gap-1'>
                <NavLink href='/clients'>Clients</NavLink>
                <NavLink href='/quotes'>Quotes</NavLink>
                <NavLink href='/products'>Products</NavLink>
                <NavLink href='/projects'>Projects</NavLink>
                <NavLink href='/reports'>Reports</NavLink>
              </nav>
            </div>

            {/* RIGHT SECTION - User + Logout */}
            <div className='flex items-center gap-3'>
              {/* User Badge */}
              <div className='hidden sm:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 rounded-full shadow-lg'>
                <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z' clipRule='evenodd' />
                </svg>
                <span className='font-medium text-sm'>{username}</span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className='flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 px-4 py-2 rounded-full font-medium text-sm transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' />
                </svg>
                <span className='hidden sm:inline'>Logout</span>
              </button>

              {/* Mobile Menu Button */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className='lg:hidden p-2 rounded-lg hover:bg-gray-700 transition-colors'
              >
                <svg 
                  className='w-6 h-6' 
                  fill='none' 
                  stroke='currentColor' 
                  viewBox='0 0 24 24'
                >
                  {mobileMenuOpen ? (
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                  ) : (
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' />
                  )}
                </svg>
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className='lg:hidden bg-gray-800 border-t border-gray-700 shadow-xl'>
            <nav className='px-4 py-3 space-y-1'>
              <MobileNavLink href='/clients' onClick={() => setMobileMenuOpen(false)}>
                Clients
              </MobileNavLink>
              <MobileNavLink href='/quotes' onClick={() => setMobileMenuOpen(false)}>
                Quotes
              </MobileNavLink>
              <MobileNavLink href='/products' onClick={() => setMobileMenuOpen(false)}>
                Products
              </MobileNavLink>
              <MobileNavLink href='/projects' onClick={() => setMobileMenuOpen(false)}>
                Projects
              </MobileNavLink>
              <MobileNavLink href='/reports' onClick={() => setMobileMenuOpen(false)}>
                Reports
              </MobileNavLink>
              
              {/* Mobile User Info */}
              <div className='sm:hidden pt-3 mt-3 border-t border-gray-700'>
                <div className='flex items-center gap-2 text-blue-400 px-3 py-2'>
                  <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z' clipRule='evenodd' />
                  </svg>
                  <span className='font-medium'>{username}</span>
                </div>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  )
}

// Desktop Navigation Link Component
function NavLink({ href, children }) {
  return (
    <Link 
      href={href}
      className='px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all font-medium text-sm'
    >
      {children}
    </Link>
  )
}

// Mobile Navigation Link Component
function MobileNavLink({ href, children, onClick }) {
  return (
    <Link 
      href={href}
      onClick={onClick}
      className='block px-3 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-all font-medium'
    >
      {children}
    </Link>
  )
}
