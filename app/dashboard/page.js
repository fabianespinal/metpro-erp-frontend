'use client'

import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const [username, setUsername] = useState('')

  useEffect(() => {
    const storedUser = localStorage.getItem('username')
    setUsername(storedUser || 'User')
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Welcome to METPRO ERP
        </h1>
        <p className="text-gray-600">
          Hello, {username}. You are successfully logged in.
        </p>
      </div>
    </div>
  )
}
