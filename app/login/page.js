'use client'
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { clearSession, isTokenExpired } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { fb } from '@/components/ui/filter-bar'
import { es } from '@/lib/i18n/es'

const t = es.login

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const router = useRouter()
  const lastAttemptRef = useRef(0)

  useEffect(() => {
    const saved = localStorage.getItem("remember_username")
    if (saved) {
      setUsername(saved)
      setRememberMe(true)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token && !isTokenExpired(token)) {
      router.push('/dashboard')
      return
    }
    if (token) clearSession()
    if (new URLSearchParams(window.location.search).get("expired") === "1") {
      setError(t.sesionExpirada)
    }
  }, [router])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    const now = Date.now()
    if (now - lastAttemptRef.current < 2000) {
      setError(t.espere)
      return
    }
    lastAttemptRef.current = now

    setLoading(true)

    try {
      const data = await api.post("/auth/login", {
        username: username.trim(),
        password: password.trim(),
      })

      localStorage.setItem("token", data.access_token)

      if (rememberMe) {
        localStorage.setItem("remember_username", username.trim())
      } else {
        localStorage.removeItem("remember_username")
      }

      if (window.toast) {
        window.toast(t.exito, {
          title: t.bienvenido,
          description: `${t.sesionIniciadaComo} ${username}`,
        })
      }

      router.push("/dashboard")
      return

    } catch (err) {
      console.error("Login error:", err)
      setError(err.message)

      if (window.toast) {
        window.toast(t.fallo, {
          title: es.comun.error,
          description: err.message,
        })
      }

    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4 relative">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm rounded-lg border border-line bg-surface p-8 shadow-card"
      >
        <div className="flex flex-col items-center mb-6">
          <img
            src="/logo.png"
            alt={es.nav.logoAlt}
            className="h-16 w-auto mb-3"
          />
        </div>

        <h1 className="text-xl font-semibold tracking-tight text-ink mb-6 text-center">
          {t.titulo}
        </h1>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 mb-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <label className="block text-sm font-medium text-ink mb-1">{t.usuario}</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={`${fb.control} h-10 mb-4`}
          required
        />

        <label className="block text-sm font-medium text-ink mb-1">{t.contrasena}</label>
        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${fb.control} h-10`}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-2 text-xs font-medium text-muted hover:text-ink"
          >
            {showPassword ? t.ocultar : t.mostrar}
          </button>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink mb-4">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={() => setRememberMe(!rememberMe)}
          />
          {t.recordarme}
        </label>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-10"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              {t.entrando}
            </span>
          ) : (
            t.entrar
          )}
        </Button>
      </form>
    </div>
  )
}