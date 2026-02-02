'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push('/clients')
    }, 300)

    return () => clearTimeout(timeout)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center relative overflow-hidden px-6">

      {/* Subtle glowing background accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[5%] w-[350px] h-[350px] bg-blue-500/20 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[10%] w-[300px] h-[300px] bg-cyan-500/20 rounded-full blur-[140px]" />
      </div>

      <div className="relative text-center animate-fade-in">
        
        {/* Placeholder logo — matches login page */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 border-2 border-blue-400 rounded-xl flex items-center justify-center text-blue-400 text-2xl font-bold tracking-wider">
            M
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
          METPRO ERP
        </h1>

        <p className="text-gray-400 text-lg mb-10 tracking-wide">
          Sistema de Gestión Empresarial
        </p>

        {/* Modern loader */}
        <div className="flex justify-center space-x-3">
          <div className="w-3 h-3 bg-blue-500/80 rounded-full animate-loader" />
          <div className="w-3 h-3 bg-blue-400/80 rounded-full animate-loader delay-150" />
          <div className="w-3 h-3 bg-cyan-400/80 rounded-full animate-loader delay-[300ms]" />
        </div>
      </div>

      {/* Animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in .7s ease-out; }

        @keyframes loader {
          0% { transform: translateY(0); opacity: .5; }
          50% { transform: translateY(-6px); opacity: 1; }
          100% { transform: translateY(0); opacity: .5; }
        }
        .animate-loader {
          animation: loader .8s infinite ease-in-out;
        }
      `}</style>
    </div>
  )
}
