'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  
  useEffect(() => {
    router.push('/clients')
  }, [router])

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='text-center'>
        <div className='text-6xl mb-4 animate-pulse'>🏗️</div>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>METPRO ERP</h1>
        <p className='text-gray-600 mb-8'>Sistema de Gestión Empresarial</p>
        <div className='flex justify-center space-x-2'>
          <div className='w-2 h-2 bg-blue-600 rounded-full animate-bounce'></div>
          <div className='w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-100'></div>
          <div className='w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200'></div>
        </div>
      </div>
    </div>
  )
}