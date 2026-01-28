'use client' 

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e) => {
  e.preventDefault()
  setError('')
  setLoading(true)

  try {
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
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='max-w-md w-full px-8 py-12 bg-white rounded-lg shadow-lg'>
        <div className='text-center mb-8'>
          <div className='text-5xl mb-2'>🏗️</div>
          <h1 className='text-3xl font-bold text-gray-900'>METPRO ERP</h1>
          <p className='text-gray-600'>Sistema de Gestión Empresarial</p>
        </div>

        <form onSubmit={handleLogin} className='space-y-6'>
          <div>
            <label htmlFor='username' className='block text-sm font-medium text-gray-700'>
              Username
            </label>
            <input
              id='username'
              type='text'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className='mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500'
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor='password' className='block text-sm font-medium text-gray-700'>
              Password
            </label>
            <input
              id='password'
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500'
              required
            />
          </div>

          {error && <div className='text-red-600 text-sm'>{error}</div>}

          <button
            type='submit'
            disabled={loading}
            className='w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50'
          >
            {loading ? 'Logging in...' : 'LOGIN'}
          </button>
        </form>
      </div>
    </div>
  )
}