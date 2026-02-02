'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // ✅ CRITICAL FIX: Removed trailing spaces from URL
      const response = await fetch('https://metpro-erp-api.onrender.com/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: username.trim(), 
          password: password.trim() 
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.detail || 'Invalid username or password')
      }

      // Save auth data
      localStorage.setItem('auth_token', data.access_token)
      localStorage.setItem('username', data.username)
      
      // Redirect with full page reload to trigger layout check
      window.location.href = '/quotes'
    } catch (err) {
      setError(err.message)
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 relative overflow-hidden'>
      {/* Animated background elements */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-1/2 -right-1/4 w-1/2 h-1/2 bg-blue-500/10 rounded-full blur-3xl animate-blob'></div>
        <div className='absolute -bottom-1/4 -left-1/4 w-1/3 h-1/3 bg-cyan-500/10 rounded-full blur-3xl animate-blob animation-delay-2000'></div>
        <div className='absolute top-1/4 left-1/3 w-1/4 h-1/4 bg-purple-500/10 rounded-full blur-3xl animate-blob animation-delay-4000'></div>
      </div>
      
      <div className='relative w-full max-w-md'>
        {/* METPRO Logo Header */}
        <div className='text-center mb-10 animate-fade-in'>
          <div className='flex justify-center items-center mb-4'>
            <div className='text-6xl animate-float'>
              🏗️
            </div>
          </div>
          <h1 className='text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 mb-2'>
            METPRO ERP
          </h1>
          <p className='text-gray-300 text-lg'>Sistema de Gestión Empresarial</p>
        </div>

        {/* Login Card - Glassmorphism Design */}
        <div className='bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-8 md:p-10 animate-fade-in-up'>
          <form onSubmit={handleLogin} className='space-y-6'>
            {/* Username Field */}
            <div className='relative'>
              <label htmlFor='username' className='block text-sm font-medium text-white mb-2 flex items-center gap-2'>
                <span className='text-xl transition-transform duration-300 group-hover:scale-110'>👤</span>
                Username
              </label>
              <div className='relative'>
                <input
                  id='username'
                  type='text'
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className='w-full px-5 py-3.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300
                    hover:border-white/40'
                  placeholder='Enter your username'
                  required
                  autoFocus
                />
                <div className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400'>
                  <span>→</span>
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div className='relative'>
              <label htmlFor='password' className='block text-sm font-medium text-white mb-2 flex items-center gap-2'>
                <span className='text-xl transition-transform duration-300 group-hover:scale-110'>🔒</span>
                Password
              </label>
              <div className='relative'>
                <input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className='w-full px-5 py-3.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300
                    hover:border-white/40'
                  placeholder='Enter your password'
                  required
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors'
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className='bg-red-500/15 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm animate-shake'>
                <div className='flex items-center gap-2'>
                  <span className='text-lg'>⚠️</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Login Button */}
            <button
              type='submit'
              disabled={loading}
              className='w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-blue-500 to-cyan-400 
                hover:from-blue-600 hover:to-cyan-500 text-white font-bold text-lg rounded-full 
                shadow-lg hover:shadow-xl transition-all duration-300 transform 
                hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-gray-900'
            >
              {loading ? (
                <>
                  <svg className='animate-spin h-5 w-5 text-white' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span className='text-xl'>🔑</span>
                  <span>LOGIN</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Note */}
          <div className='mt-8 pt-6 border-t border-white/10 text-center'>
            <p className='text-gray-400 text-sm'>
              © {new Date().getFullYear()} METPRO ERP • Enterprise Resource Planning
            </p>
            <p className='text-blue-300/80 text-xs mt-1 font-medium'>
              Secure • Reliable • Professional
            </p>
          </div>
        </div>

        {/* Decorative Corner Elements */}
        <div className='absolute -top-4 -right-4 w-16 h-16 bg-blue-500/20 rounded-full blur-2xl'></div>
        <div className='absolute -bottom-6 -left-6 w-24 h-24 bg-cyan-500/20 rounded-full blur-3xl'></div>
      </div>

      {/* Animation Styles */}
      <style jsx global>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -10px) scale(1.1); }
          50% { transform: translate(10px, 20px) scale(0.95); }
          75% { transform: translate(-10px, 10px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 15s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fade-in 0.6s ease-out 0.1s forwards;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
          20%, 40%, 60%, 80% { transform: translateX(3px); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
      `}</style>
    </div>
  )
}