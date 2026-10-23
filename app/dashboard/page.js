'use client'
import { api } from "@/lib/api"
import { money } from "@/lib/money"
import { businessMonth, localDateEsDO } from '@/lib/dates'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { useCurrentRole } from '@/lib/currentRole'
import { es } from '@/lib/i18n/es'

// Counts follow the quote and invoice status matrices.
const PENDING_QUOTE_STATUSES = ['Draft', 'Final', 'Sent']
const OPEN_INVOICE_STATUSES = ['Pending', 'Overdue']

export default function DashboardPage() {
  // Display name from GET /auth/me: full name, then username, then 'User'.
  const [displayName, setDisplayName] = useState('Usuario')
  const [loadErrors, setLoadErrors] = useState([])
  const [loading, setLoading] = useState(true) // E-09: no 0 / $0.00 flash before data arrives
  const { isAdmin } = useCurrentRole()
  const [stats, setStats] = useState({
    clients: 0,
    pendingQuotes: 0,
    openInvoices: 0,
    totalExpenses: 0,
    monthlyExpenses: 0,
    revenue: 0,
    profit: 0
  })

  const [recentQuotes, setRecentQuotes] = useState([])
  const [recentInvoices, setRecentInvoices] = useState([])
  const [recentExpenses, setRecentExpenses] = useState([])

  // Display name
  useEffect(() => {
    let cancelled = false
    api('/auth/me')
      .then((me) => {
        if (!cancelled && me) setDisplayName(me.name || me.username || 'User')
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // Load dashboard data. Each source loads independently; a failure is shown, not zeroed silently.
  useEffect(() => {
    let cancelled = false
    async function loadDashboardData() {
      const sources = [
        ['Clientes', '/clients/'],
        ['Cotizaciones', '/quotes/'],
        ['Facturas', '/invoices/'],
        ['Gastos', '/expenses/'],
      ]
      const results = await Promise.allSettled(sources.map(([, path]) => api(path)))
      if (cancelled) return

      const errors = []
      const data = results.map((r, i) => {
        if (r.status === 'fulfilled' && Array.isArray(r.value)) return r.value
        errors.push(`${sources[i][0]}: ${r.status === 'rejected' ? r.reason?.message || 'error' : es.dashboard.respuestaInvalida}`)
        return null
      })
      setLoadErrors(errors)
      const [clients, quotes, invoices, expenses] = data

      const sumBy = (rows, f) => (rows || []).reduce((acc, x) => acc + Number(f(x) || 0), 0)
      const currentMonth = businessMonth() // Santo Domingo month (E-05)

      const totalExpenses = sumBy(expenses, e => e.amount)
      const monthlyExpenses = sumBy((expenses || []).filter(e => String(e.date || '').startsWith(currentMonth)), e => e.amount)
      // Collected money: payments recorded on invoices, excluding cancelled ones.
      const activeInvoices = (invoices || []).filter(inv => inv.status !== 'Cancelled')
      const revenue = sumBy(activeInvoices, inv => inv.amount_paid)
      // X-04: profit uses collected money WITHOUT ITBIS (tax owed to DGII), same basis as the reports:
      // each payment counts its share (total - itbis) / total of its invoice.
      const revenueNet = sumBy(activeInvoices, inv => {
        const total = Number(inv.total_amount || 0)
        const itbis = Number(inv.itbis_total || 0)
        return total > 0 ? Number(inv.amount_paid || 0) * (total - itbis) / total : Number(inv.amount_paid || 0)
      })

      setStats({
        clients: clients ? clients.length : 0,
        pendingQuotes: (quotes || []).filter(q => PENDING_QUOTE_STATUSES.includes(q.status)).length,
        openInvoices: (invoices || []).filter(inv => OPEN_INVOICE_STATUSES.includes(inv.status)).length,
        totalExpenses,
        monthlyExpenses,
        revenue,
        profit: revenueNet - totalExpenses
      })

      const recent = (rows) => [...(rows || [])]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
      setRecentQuotes(recent(quotes))
      setRecentInvoices(recent(invoices))
      setRecentExpenses(recent(expenses))
      setLoading(false)
    }

    loadDashboardData()
    return () => {
      cancelled = true
    }
  }, [])

  const modules = [
    {
      name: 'Clientes',
      description: 'Gestionar información y contactos de clientes',
      href: '/clients',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      )
    },
    {
      name: 'Productos',
      description: 'Gestionar catálogo y precios de productos',
      href: '/products',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      )
    },
    {
      name: 'Cotizaciones',
      description: 'Crear y gestionar cotizaciones de precios',
      href: '/quotes',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      )
    },
    {
      name: 'Facturas',
      description: 'Generar y rastrear facturas',
      href: '/invoices',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"
          />
        </svg>
      )
    },
    {
      name: 'Proyectos',
      description: 'Dar seguimiento a proyectos y trabajos aprobados',
      href: '/proyectos',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      )
    },
    {
      name: 'Gastos',
      description: 'Registrar y analizar gastos operativos',
      href: '/expenses',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8c-1.657 0-3 1.343-3 3h6c0-1.657-1.343-3-3-3zm0 0V5m0 6v6m0 0h3m-3 0H9"
          />
        </svg>
      )
    },
    {
      name: 'Reportes',
      description: 'Ver análisis y reportes',
      href: '/reports',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      )
    }
  ]

  // Admin-only module: one "Ajustes" card that opens /ajustes (Usuarios, Encabezados PDF, Plantillas, Sello, Términos).
  const adminModules = [
    {
      name: 'Ajustes',
      description: 'Usuarios, encabezados PDF, plantillas, sello y términos',
      href: '/ajustes',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      )
    }
  ]

  return (
    <div className="text-ink">

      {/* HEADER */}
      <PageHeader
        title="Panel"
        subtitle="Sistema ERP Metpro"
        actions={<span className="text-sm font-medium text-ink">Bienvenido, {displayName}</span>}
      />

      {loadErrors.length > 0 && (
        <div role="alert" className="mb-6 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          No se pudieron cargar algunos datos; las cifras pueden estar incompletas.
          <ul className="mt-1 list-disc pl-5">
            {loadErrors.map((e) => <li key={e}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* MODULE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...modules, ...(isAdmin ? adminModules : [])].map((module) => (
          <Link
            key={module.name}
            href={module.href}
            className="
              bg-surface border border-line rounded-xl p-6 shadow-card
              hover:border-accent transition-colors duration-200 cursor-pointer
            "
          >
            <div className="flex items-start gap-4">
              <div className="text-accent">{module.icon}</div>
              <div>
                <h3 className="text-lg font-semibold mb-1 text-ink">{module.name}</h3>
                <p className="text-sm text-muted">{module.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* QUICK STATS */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6" aria-busy={loading}>

        <div className="bg-surface border border-line rounded-xl p-6 shadow-card">
          <div className="text-sm text-muted mb-1">Clientes Activos</div>
          <div className="text-3xl font-bold text-ink">{loading ? '…' : stats.clients}</div>
        </div>

        <div className="bg-surface border border-line rounded-xl p-6 shadow-card">
          <div className="text-sm text-muted mb-1">Cotizaciones Pendientes</div>
          <div className="text-3xl font-bold text-ink">{loading ? '…' : stats.pendingQuotes}</div>
        </div>

        <div className="bg-surface border border-line rounded-xl p-6 shadow-card">
          <div className="text-sm text-muted mb-1">Facturas Abiertas</div>
          <div className="text-3xl font-bold text-ink">{loading ? '…' : stats.openInvoices}</div>
        </div>

        <div className="bg-surface border border-line rounded-xl p-6 shadow-card">
          <div className="text-sm text-muted mb-1">Gastos Totales</div>
          <div className="text-3xl font-bold">{loading ? '…' : money(stats.totalExpenses)}</div>
        </div>

      </div>

      {/* FINANCIAL OVERVIEW */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-surface border border-line rounded-xl p-6 shadow-card">
          <div className="text-sm text-muted mb-1">Cobrado (pagos recibidos, con ITBIS)</div>
          <div className="text-3xl font-bold text-emerald-600">{loading ? '…' : money(stats.revenue)}</div>
        </div>

        <div className="bg-surface border border-line rounded-xl p-6 shadow-card">
          <div className="text-sm text-muted mb-1">Gastos del Mes</div>
          <div className="text-3xl font-bold text-amber-600">{loading ? '…' : money(stats.monthlyExpenses)}</div>
        </div>

        <div className="bg-surface border border-line rounded-xl p-6 shadow-card">
          <div className="text-sm text-muted mb-1">Ganancia Neta (cobrado sin ITBIS − gastos)</div>
          <div className={`text-3xl font-bold ${stats.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {loading ? '…' : money(stats.profit)}
          </div>
        </div>

      </div>

      {/* RECENT ACTIVITY */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Last 5 Quotes */}
        <div className="bg-surface border border-line rounded-xl p-6 shadow-card">
          <h2 className="text-lg font-semibold mb-4 text-ink">Cotizaciones Recientes</h2>
          {recentQuotes.length === 0 && (
            <p className="text-muted text-sm">No hay cotizaciones recientes</p>
          )}
          <ul className="space-y-3">
            {recentQuotes.map((q) => (
              <li key={q.id} className="flex justify-between text-sm">
                <span className="text-ink">#{q.id} — {q.client_name}</span>
                <span className="text-muted">{localDateEsDO(q.created_at)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Last 5 Invoices */}
        <div className="bg-surface border border-line rounded-xl p-6 shadow-card">
          <h2 className="text-lg font-semibold mb-4 text-ink">Facturas Recientes</h2>
          {recentInvoices.length === 0 && (
            <p className="text-muted text-sm">No hay facturas recientes</p>
          )}
          <ul className="space-y-3">
            {recentInvoices.map((inv) => (
              <li key={inv.id} className="flex justify-between text-sm">
                <span className="text-ink">#{inv.invoice_number} — {inv.client_name}</span>
                <span className="text-muted">{localDateEsDO(inv.created_at)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Last 5 Expenses */}
        <div className="bg-surface border border-line rounded-xl p-6 shadow-card">
          <h2 className="text-lg font-semibold mb-4 text-ink">Gastos Recientes</h2>
          {recentExpenses.length === 0 && (
            <p className="text-muted text-sm">No hay gastos recientes</p>
          )}
          <ul className="space-y-3">
            {recentExpenses.map((exp) => (
              <li key={exp.expense_id} className="flex justify-between text-sm">
                <span className="text-ink">{exp.category} — {money(Number(exp.amount))}</span>
                <span className="text-muted">{localDateEsDO(exp.created_at)}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

    </div>
  )
}