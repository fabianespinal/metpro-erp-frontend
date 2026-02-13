import { useState, useEffect } from 'react'

export function useToken() {
  const [token, setToken] = useState(null)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    setToken(storedToken)
  }, [])

  return token
}
