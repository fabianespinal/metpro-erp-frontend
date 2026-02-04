'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export const dynamic = "force-dynamic";

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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        })
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.detail || 'Invalid username or password')

      localStorage.setItem('auth_token', data.access_token)
      localStorage.setItem('username', username.trim())

      router.push("/dashboard")

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4 relative">

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[10%] w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-15%] right-[5%] w-[350px] h-[350px] bg-cyan-500/20 rounded-full blur-[160px]" />
      </div>

      <div className="relative w-full max-w-md space-y-8 animate-fade-in">

        <div className='text-center'>
          <div className="flex justify-center items-center mb-6 animate-float">
            <img
              src="/logo.png"
              alt="METPRO Logo"
              className="h-20 w-auto object-contain filter drop-shadow-lg"
              onError={(e) => {
                if (e.target instanceof HTMLImageElement) {
                  e.target.style.display = "none"
                }
              }}
            />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            METPRO ERP
          </h1>
          <p className="text-gray-400 mt-2 tracking-wide">
            Enterprise Resource Management System
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-8 md:p-10">

          <form onSubmit={handleLogin} className="space-y-6">

            <div>
              <label className="block text-gray-200 text-sm font-medium mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Enter your username"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-gray-200 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Enter your password"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" 
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                        d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                        d="M3 3l18 18M3.98 8.223C2.62 9.58 2.25 12 2.25 12s3.75 7.5 9.75 7.5c2.095 0 3.932-.624 5.457-1.59M14.12 9.88A3 3 0 009.88 14.12" />
                    </svg>
                  )}
                </button>

              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-lg text-sm animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500
                hover:from-blue-700 hover:to-cyan-600 text-white font-semibold tracking-wide
                transition-all shadow-lg hover:shadow-2xl transform hover:scale-[1.01] 
              disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : "Login"}
            </button>
          </form>

          <div className="text-center mt-8 pt-6 border-t border-white/10">
            <p className="text-gray-500 text-xs tracking-wide">
              © {new Date().getFullYear()} METPRO ERP — Secure Enterprise Access
            </p>
          </div>

        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in .7s ease-out; }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }

        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%,60% { transform: translateX(-4px); }
          40%,80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake .4s; }
      `}</style>

    </div>
  )
}
