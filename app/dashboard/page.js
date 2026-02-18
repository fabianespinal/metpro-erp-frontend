'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function DashboardPage() {
  const [username, setUsername] = useState('')
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

  // Load username
  useEffect(() => {
    const storedUser = localStorage.getItem('username')
    setUsername(storedUser || 'User')
  }, [])

  // Load dashboard data
  useEffect(() => {
    async function loadDashboardData() {
      try {
        const token = localStorage.getItem('token')
        const API = process.env.NEXT_PUBLIC_API_URL

        const [clientsRes, quotesRes, invoicesRes, expensesRes] = await Promise.all([
          fetch(`${API}/clients`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/quotes`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/invoices`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/expenses`, { headers: { Authorization: `Bearer ${token}` } })
        ])

        const clients = await clientsRes.json()
        const quotes = await quotesRes.json()
        const invoices = await invoicesRes.json()
        const expenses = await expensesRes.json()

        // Compute stats
        const activeClients = clients.length
        const pendingQuotes = quotes.filter(
          q => q.status !== 'Approved' && q.status !== 'Invoiced'
        ).length
        const openInvoices = invoices.filter(inv => inv.status !== 'Paid').length

        // Expenses totals
        const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

        const currentMonth = new Date().toISOString().slice(0, 7)
        const monthlyExpenses = expenses
          .filter(e => e.date.startsWith(currentMonth))
          .reduce((sum, e) => sum + Number(e.amount), 0)

        // Revenue (paid invoices)
        const revenue = invoices
          .filter(inv => inv.status === 'Paid')
          .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)

        const profit = revenue - totalExpenses

        // Recent activity
        const lastQuotes = [...quotes]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5)

        const lastInvoices = [...invoices]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5)

        const lastExpenses = [...expenses]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5)

        setStats({
          clients: activeClients,
          pendingQuotes,
          openInvoices,
          totalExpenses,
          monthlyExpenses,
          revenue,
          profit
        })

        setRecentQuotes(lastQuotes)
        setRecentInvoices(lastInvoices)
        setRecentExpenses(lastExpenses)

      } catch (err) {
        console.error('Dashboard load error:', err)
      }
    }

    loadDashboardData()
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
      name: 'Products',
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
      description: 'Rastrear proyectos y hitos',
      href: '/projects',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      )
    },
    {
      name: 'Expenses',
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

  // Debug log (moved to proper location)
  console.log("DASHBOARD MODULES:", modules)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-8">

      {/* HEADER */}
      <header className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-wide">Dashboard</h1>
        </div>

        <div className="text-right opacity-80 text-sm">
          <p className="font-semibold">Welcome, {username}</p>
          <p className="text-gray-400">Metpro ERP System</p>
        </div>
      </header>

      {/* MODULE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <Link
            key={module.name}
            href={module.href}
            className="
              bg-gray-800/60 border border-gray-700 rounded-xl p-6
              hover:bg-gray-700/60 hover:scale-[1.02] transition-all duration-200
              shadow-lg hover:shadow-xl cursor-pointer
            "
          >
            <div className="flex items-start gap-4">
              <div className="text-gray-300">{module.icon}</div>
              <div>
                <h3 className="text-lg font-semibold mb-1">{module.name}</h3>
                <p className="text-sm text-gray-400">{module.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* QUICK STATS */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">

        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 shadow-lg">
          <div className="text-sm text-gray-400 mb-1">Clientes Activos</div>
          <div className="text-3xl font-bold">{stats.clients}</div>
        </div>

        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 shadow-lg">
          <div className="text-sm text-gray-400 mb-1">Cotizaciones Pendientes</div>
          <div className="text-3xl font-bold">{stats.pendingQuotes}</div>
        </div>

        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 shadow-lg">
          <div className="text-sm text-gray-400 mb-1">Facturas Abiertas</div>
          <div className="text-3xl font-bold">{stats.openInvoices}</div>
        </div>

        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 shadow-lg">
          <div className="text-sm text-gray-400 mb-1">Gastos Totales</div>
          <div className="text-3xl font-bold">${stats.totalExpenses.toFixed(2)}</div>
        </div>

      </div>

      {/* FINANCIAL OVERVIEW */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 shadow-lg">
          <div className="text-sm text-gray-400 mb-1">Ingresos (Facturas Pagadas)</div>
          <div className="text-3xl font-bold text-green-400">${stats.revenue.toFixed(2)}</div>
        </div>

        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 shadow-lg">
          <div className="text-sm text-gray-400 mb-1">Gastos del Mes</div>
          <div className="text-3xl font-bold text-yellow-400">${stats.monthlyExpenses.toFixed(2)}</div>
        </div>

        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 shadow-lg">
          <div className="text-sm text-gray-400 mb-1">Ganancia Neta</div>
          <div className={`text-3xl font-bold ${stats.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${stats.profit.toFixed(2)}
          </div>
        </div>

      </div>

      {/* RECENT ACTIVITY */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Last 5 Quotes */}
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Cotizaciones Recientes</h2>
          {recentQuotes.length === 0 && (
            <p className="text-gray-400 text-sm">No hay cotizaciones recientes</p>
          )}
          <ul className="space-y-3">
            {recentQuotes.map((q) => (
              <li key={q.id} className="flex justify-between text-sm">
                <span className="text-gray-300">#{q.id} — {q.client_name}</span>
                <span className="text-gray-500">{new Date(q.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Last 5 Invoices */}
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Facturas Recientes</h2>
          {recentInvoices.length === 0 && (
            <p className="text-gray-400 text-sm">No hay facturas recientes</p>
          )}
          <ul className="space-y-3">
            {recentInvoices.map((inv) => (
              <li key={inv.id} className="flex justify-between text-sm">
                <span className="text-gray-300">#{inv.invoice_number} — {inv.client_name}</span>
                <span className="text-gray-500">{new Date(inv.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Last 5 Expenses */}
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Gastos Recientes</h2>
          {recentExpenses.length === 0 && (
            <p className="text-gray-400 text-sm">No hay gastos recientes</p>
          )}
          <ul className="space-y-3">
            {recentExpenses.map((exp) => (
              <li key={exp.expense_id} className="flex justify-between text-sm">
                <span className="text-gray-300">{exp.category} — ${Number(exp.amount).toFixed(2)}</span>
                <span className="text-gray-500">{new Date(exp.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

    </div>
  )
}