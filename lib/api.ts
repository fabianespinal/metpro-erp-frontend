"use client";

import { handleUnauthorized } from "@/lib/auth";

/** For raw fetch() callers: route a 401 to the login page like api() does. */
export function checkUnauthorized(res: Response): void {
  if (res.status === 401) handleUnauthorized();
}

/**
 * Success responses are {"data": payload, "success": true}.
 * Return the payload. Any other body is returned unchanged (errors, legacy shapes).
 */
export function unwrapEnvelope<T = unknown>(body: unknown): T {
  if (body && typeof body === "object" && (body as { success?: unknown }).success === true && "data" in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}

/** Shown when the browser cannot reach the API at all (debug E-06; was "Failed to fetch"). */
export const NETWORK_ERROR_MESSAGE =
  "No se pudo conectar con el servidor. Verifique su conexión e intente de nuevo.";

/** fetch() with a Spanish message on network failure. HTTP errors are returned as usual. */
export async function safeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    const err = new Error(NETWORK_ERROR_MESSAGE) as Error & { code?: string };
    err.code = "NETWORK_ERROR";
    throw err;
  }
}

export async function api(endpoint: string, options: RequestInit = {}) {
  const rawBase = process.env.NEXT_PUBLIC_API_URL;
  if (!rawBase) throw new Error("Backend URL missing");

  const BASE_URL = rawBase.replace(/\/+$/, "");

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const incomingHeaders = (options.headers as Record<string, string>) || {};

  const headers: Record<string, string> = {
    ...incomingHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const isFormData = options.body instanceof FormData;
  if (!isFormData && !incomingHeaders["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await safeFetch(`${BASE_URL}${endpoint}`, {
    ...options,
    method: options.method || "GET",
    headers,
    cache: "no-store",
    mode: "cors",
  });

  if (!res.ok) {
    // Expired or revoked session: clear it and go to login (not for the login call itself).
    if (res.status === 401 && !endpoint.startsWith("/auth/login")) handleUnauthorized();
    const text = await res.text().catch(() => "");
    let message = `API error ${res.status}`;
    let code: string | undefined;
    try {
      const body = JSON.parse(text);
      if (body && body.detail) {
        message = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
      }
      if (body && typeof body.code === "string") {
        code = body.code;
      }
    } catch {
      if (text) message = `API error ${res.status}: ${text}`;
    }
    const err = new Error(message) as Error & { status?: number; code?: string };
    err.status = res.status;
    if (code) err.code = code;
    throw err;
  }

  return res.json().catch(() => null).then(unwrapEnvelope);
}

// Convenience helpers
api.get = (endpoint: string) =>
  api(endpoint, { method: "GET" });

api.post = (endpoint: string, data?: unknown) =>
  api(endpoint, {
    method: "POST",
    body: data instanceof FormData ? data : JSON.stringify(data),
  });

api.put = (endpoint: string, data?: unknown) =>
  api(endpoint, {
    method: "PUT",
    body: data instanceof FormData ? data : JSON.stringify(data),
  });

api.patch = (endpoint: string, data?: unknown) =>
  api(endpoint, {
    method: "PATCH",
    body: data instanceof FormData ? data : JSON.stringify(data),
  });

api.delete = (endpoint: string) =>
  api(endpoint, { method: "DELETE" });


// ------------------------------------------------------
// SEND TO CLIENT (Quotes + Invoices)
// ------------------------------------------------------

/**
 * Optional files are sent as multipart "files" parts, attached to the email and discarded by the backend.
 * printSeal adds the company seal to the emailed PDF. The field is sent only when true, so a send without
 * a seal is byte for byte the request it always was.
 */
export function sendBody(files?: File[], printSeal: boolean = false): FormData | undefined {
  const hasFiles = !!files && files.length > 0;
  if (!hasFiles && printSeal !== true) return undefined;
  const fd = new FormData();
  (files ?? []).forEach((f) => fd.append("files", f, f.name));
  if (printSeal === true) fd.append("print_seal", "true");
  return fd;
}

export async function sendQuoteToClient(quoteId: string | number, files?: File[], printSeal: boolean = false) {
  return api(`/quotes/${quoteId}/send`, {
    method: "POST",
    body: sendBody(files, printSeal),
  });
}

export async function sendInvoiceToClient(invoiceId: string | number, files?: File[], printSeal: boolean = false) {
  return api(`/invoices/${invoiceId}/send`, {
    method: "POST",
    body: sendBody(files, printSeal),
  });
}