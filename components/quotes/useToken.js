import { useState } from 'react'

// Read once on the client. The token is never rendered, so there is no hydration mismatch.
export function useToken() {
  const [token] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('token') : null))
  return token
}
