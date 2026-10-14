import { useSyncExternalStore } from 'react'

// Reads a value from localStorage without calling setState inside an effect.
// Server render uses `fallback`. Client render reads localStorage.
// Re-renders when another tab changes the key (storage event).
function subscribe(callback) {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

export function useStoredItem(key, fallback = null) {
  return useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(key) ?? fallback,
    () => fallback
  )
}
