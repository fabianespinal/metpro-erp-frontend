"use client"

import { useEffect, useState, useSyncExternalStore } from "react"

import { beginRequest, endRequest, getPending, subscribeLoading } from "@/lib/loading"

/**
 * Top progress bar shown while any call to the backend is in flight (item 13, module 5).
 *
 * How it counts: wraps window.fetch for URLs that start with NEXT_PUBLIC_API_URL.
 * This also covers pages that call fetch directly (dashboard, reports, invoices).
 * Page code is not changed. The bar appears after 150 ms so quick calls do not flash.
 * Installed once. Restored on unmount.
 */
const SHOW_DELAY_MS = 150

function apiBase(): string | null {
  const raw = process.env.NEXT_PUBLIC_API_URL
  return raw ? raw.replace(/\/+$/, "") : null
}

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === "string") return input
  if (input instanceof URL) return input.href
  return input.url
}

export default function GlobalLoader() {
  const pending = useSyncExternalStore(subscribeLoading, getPending, () => 0)
  const [visible, setVisible] = useState(false)

  // Install the counting wrapper once.
  useEffect(() => {
    const base = apiBase()
    if (!base || typeof window === "undefined") return
    const original = window.fetch
    const wrapped: typeof window.fetch = (input, init) => {
      if (!urlOf(input).startsWith(base)) return original(input, init)
      beginRequest()
      return original(input, init).finally(endRequest)
    }
    window.fetch = wrapped
    return () => {
      if (window.fetch === wrapped) window.fetch = original
    }
  }, [])

  // Show after a short delay. Cleanup hides it when the count changes or goes idle.
  useEffect(() => {
    if (pending === 0) return
    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS)
    return () => {
      clearTimeout(timer)
      setVisible(false)
    }
  }, [pending])

  if (!visible || pending === 0) return null

  return (
    <div
      role="progressbar"
      aria-label="Loading"
      aria-busy="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden bg-line"
    >
      <div className="loader-bar h-full w-1/3 bg-accent" />
    </div>
  )
}
