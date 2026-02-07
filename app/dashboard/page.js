'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function DashboardPage() {
  const [username, setUsername] = useState('')

  useEffect(() => {
    const storedUser = localStorage.getItem('username')
    setUsername(storedUser || 'User')
  }, [])

  const modules = [
    {
      name: 'Clients',
      description: 'Manage client information and contacts',
      href: '/clients',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'blue'
    },
    {
      name: 'Products',
      description: 'Manage product catalog and pricing',
      href: '/products',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      color: 'green'
    },
    {
      name: 'Quotes',
      description: 'Create and manage price quotes',
      href: '/quotes',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'purple'
    },
    {
      name: 'Invoices',
      description: 'Generate and track invoices',
      href: '/invoices',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
        </svg>
      ),
      color: 'orange'
    },
    {
      name: 'Projects',
      description: 'Track projects and milestones',
      href: '/projects',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      color: 'indigo'
    },
    {
      name: 'Reports',
      description: 'View analytics and reports',
      href: '/reports',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'red'
    }
  ]

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    green: 'bg-green-50 text-green-600 hover:bg-green-100',
    purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
    orange: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
    indigo: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
    red: 'bg-red-50 text-red-600 hover:bg-red-100'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome, {username}
        </h1>
        <p className="text-gray-600">
          Select a module to get started
        </p>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <Link
            key={module.name}
            href={module.href}
            className={`${colorClasses[module.color]} rounded-lg p-6 transition-all hover:shadow-lg border border-transparent hover:border-gray-200`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {module.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  {module.name}
                </h3>
                <p className="text-sm opacity-80">
                  {module.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Stats (Optional - you can expand this) */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Active Clients</div>
          <div className="text-2xl font-bold text-gray-800">--</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Pending Quotes</div>
          <div className="text-2xl font-bold text-gray-800">--</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Open Invoices</div>
          <div className="text-2xl font-bold text-gray-800">--</div>
        </div>
      </div>

    </div>
  )
}
/* Quick Stats (Optional - you can expand this) */