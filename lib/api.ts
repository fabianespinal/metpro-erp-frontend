"use client";

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

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    method: options.method || "GET",
    headers,
    cache: "no-store",
    mode: "cors",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return res.json().catch(() => null);
}

// Keep these helpers so invoiceApi.ts and others don't break
api.get = (endpoint: string) =>
  api(endpoint, { method: "GET" });

api.post = (endpoint: string, data?: any) =>
  api(endpoint, {
    method: "POST",
    body: data instanceof FormData ? data : JSON.stringify(data),
  });

api.put = (endpoint: string, data?: any) =>
  api(endpoint, {
    method: "PUT",
    body: data instanceof FormData ? data : JSON.stringify(data),
  });

api.delete = (endpoint: string) =>
  api(endpoint, { method: "DELETE" });