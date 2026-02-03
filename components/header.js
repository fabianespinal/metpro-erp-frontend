'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

// Navigation link (desktop)
const NavLink = ({ href, children }) => (
  <Link
    href={href}
    className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all font-medium text-sm flex items-center gap-1.5"
  >
    {children}
  </Link>
)

// Navigation link (mobile)
const MobileNavLink = ({ href, children, onClick }) => (
  <Link
    href={href}
    onClick={onClick}
    className="block px-3 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-all font-medium flex items-center justify-between"
  >
    <span>{children}</span>
  </Link>
)

export default function Header() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [username, setUsername] = useState(null)
  const [showHeader, setShowHeader] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)

    const storedUser = localStorage.getItem('username')
    setUsername(storedUser || 'User')

    setShowHeader(storedUser && window.location.pathname !== '/login')

    return () => setMobileMenuOpen(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('username')
    setMobileMenuOpen(false)
    router.push('/login')
  }

  if (!mounted || !showHeader) return null

  return (
    <>
      <header className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white shadow-xl sticky top-0 z-50 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* LEFT SECTION: Logo + Desktop Nav */}
            <div className="flex items-center gap-2 md:gap-3">

              {/* Logo now goes to DASHBOARD */}
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="relative h-8 w-8 md:w-10">
                  <img
                    src="/logo.png"
                    alt="METPRO Logo"
                    className="h-full w-auto object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      const fallback = e.target.nextElementSibling
                      if (fallback) fallback.style.display = 'block'
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

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-1 ml-6">
                <NavLink href="/dashboard">Dashboard</NavLink>
                <NavLink href="/clients">Clients</NavLink>
                <NavLink href="/quotes">Quotes</NavLink>
                <NavLink href="/products">Products</NavLink>
                <NavLink href="/projects">Projects</NavLink>
                <NavLink href="/reports">Reports</NavLink>
              </nav>
            </div>

            {/* RIGHT SECTION: Username + Logout + Mobile Menu */}
            <div className="flex items-center gap-3">

              {username && username !== 'undefined' && (
                <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 rounded-full shadow-lg">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium text-sm">{username}</span>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 px-3 md:px-4 py-2 rounded-full font-medium text-sm transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                aria-label="Logout"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-700 transition-colors"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-gray-800 border-t border-gray-700 shadow-xl py-2">
            <nav className="px-4 space-y-1">

              <MobileNavLink href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                Dashboard
              </MobileNavLink>

              <MobileNavLink href="/clients" onClick={() => setMobileMenuOpen(false)}>
                Clients
              </MobileNavLink>

              <MobileNavLink href="/quotes" onClick={() => setMobileMenuOpen(false)}>
                Quotes
              </MobileNavLink>

              <MobileNavLink href="/products" onClick={() => setMobileMenuOpen(false)}>
                Products
              </MobileNavLink>

              <MobileNavLink href="/projects" onClick={() => setMobileMenuOpen(false)}>
                Projects
              </MobileNavLink>

              <MobileNavLink href="/reports" onClick={() => setMobileMenuOpen(false)}>
                Reports
              </MobileNavLink>

              {username && username !== 'undefined' && (
                <div className="pt-4 mt-4 border-t border-gray-700">
                  <div className="flex items-center gap-2 text-blue-400 bg-gray-700/30 px-3 py-2 rounded-lg">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium text-white">Logged in as: {username}</span>
                  </div>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  )
}