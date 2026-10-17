'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// La ruta /projects se movió a /proyectos. Se conserva para enlaces y marcadores antiguos.
export default function ProjectsRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/proyectos')
  }, [router])
  return null
}
