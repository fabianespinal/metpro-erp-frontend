/**
 * Pending-request counter for the global loader (item 13, module 5).
 * Presentation state only. No data is read or changed.
 */
let pending = 0
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

export function beginRequest() {
  pending += 1
  emit()
}

export function endRequest() {
  pending = Math.max(0, pending - 1)
  emit()
}

export function getPending() {
  return pending
}

export function subscribeLoading(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
