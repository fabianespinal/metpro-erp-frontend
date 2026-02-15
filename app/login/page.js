'use client'
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const router = useRouter()
  const lastAttemptRef = useRef(0)

  // Auto-fill username if remembered
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("remember_username")
      if (savedUser) {
        setUsername(savedUser)
        setRememberMe(true)
      }
    }
  }, [])

  // Redirect if already logged in
  useEffect(() => {
    const token = typeof window !== "undefined"
      ? localStorage.getItem('token')
      : null

    if (token) {
      router.push('/dashboard')
    }
  }, [router])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    // Rate-limit: 1 attempt every 2 seconds
    const now = Date.now()
    if (now - lastAttemptRef.current < 2000) {
      setError("Please wait a moment before trying again.")
      return
    }
    lastAttemptRef.current = now

    setLoading(true)

    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        })
      })

      if (typeof window !== "undefined") {
        localStorage.setItem("token", data.access_token)

        // Save username only if "Remember me" is checked
        if (rememberMe) {
          localStorage.setItem("remember_username", username.trim())
        } else {
          localStorage.removeItem("remember_username")
        }
      }

      // Toast (if available globally)
      if (typeof window !== "undefined" && window.toast) {
        window.toast("Login successful!", {
          title: "Welcome back",
          description: `Logged in as ${username}`
        })
      }

      router.push("/dashboard")
      return

    } catch (error) {
      console.error("Login error:", error)
      setError(error.message)

      if (typeof window !== "undefined" && window.toast) {
        window.toast("Login failed", {
          title: "Error",
          description: error.message
        })
      }

    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4 relative">

      <form
        onSubmit={handleLogin}
        className="bg-gray-800/60 backdrop-blur-xl p-8 rounded-xl shadow-xl w-full max-w-md border border-gray-700"
      >

        {/* LOGO */}
        <div className="flex flex-col items-center mb-6">
          <img
            src="/logo.png"
            alt="METPRO Logo"
            className="h-20 w-auto mb-3 drop-shadow-lg"
          />
        </div>

        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          Login
        </h1>

        {error && (
          <div className="bg-red-500/20 text-red-300 border border-red-500/40 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Username */}
        <label className="block text-gray-300 text-sm mb-1">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-white mb-4"
          required
        />

        {/* Password */}
        <label className="block text-gray-300 text-sm mb-1">Password</label>
        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-white"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-200"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        {/* Remember Me */}
        <label className="flex items-center gap-2 text-gray-300 text-sm mb-4">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={() => setRememberMe(!rememberMe)}
          />
          Remember me
        </label>

        {/* Login Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              Logging in...
            </span>
          ) : (
            "Login"
          )}
        </button>
      </form>
    </div>
  )
}