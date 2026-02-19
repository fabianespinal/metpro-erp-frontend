"use client";

async function request(endpoint: string, options: RequestInit = {}) {
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

export const api = {
  get: (endpoint: string) =>
    request(endpoint, { method: "GET" }),

  post: (endpoint: string, data?: any) =>
    request(endpoint, {
      method: "POST",
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  put: (endpoint: string, data?: any) =>
    request(endpoint, {
      method: "PUT",
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  delete: (endpoint: string) =>
    request(endpoint, { method: "DELETE" }),
};