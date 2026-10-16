"use client";

/**
 * Session helpers. The JWT lives in localStorage under "token".
 *
 * - isTokenExpired: reads the "exp" claim (no signature check; the server
 *   still validates every request). Treats unreadable tokens as expired.
 * - handleUnauthorized: called on any 401. Clears the session and sends the
 *   user to /login?expired=1 instead of leaving pages silently empty.
 *
 * No import from lib/api or lib/currentRole here, to avoid import cycles.
 * The full page navigation in handleUnauthorized resets every in-memory cache.
 */

const TOKEN_KEY = "token";
const PUBLIC_PREFIXES = ["/q/", "/inv/", "/login"];

export function getToken(): string | null {
  try {
    return typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_KEY) : null;
  } catch {
    return null;
  }
}

export function tokenExpiry(token: string | null): number | null {
  if (!token) return null;
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    const exp = JSON.parse(json)?.exp;
    return typeof exp === "number" ? exp : null;
  } catch {
    return null;
  }
}

/** True when the token is missing, unreadable, or expires within skewSeconds. */
export function isTokenExpired(token: string | null, skewSeconds = 30): boolean {
  const exp = tokenExpiry(token);
  if (exp === null) return true;
  return Date.now() / 1000 >= exp - skewSeconds;
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem("username");
  } catch {
    // storage unavailable: nothing to clear
  }
}

let redirecting = false;

export function handleUnauthorized(): void {
  if (typeof window === "undefined" || redirecting) return;
  const path = window.location.pathname;
  if (PUBLIC_PREFIXES.some((p) => path.startsWith(p))) return;
  redirecting = true;
  clearSession();
  window.location.assign("/login?expired=1");
}
