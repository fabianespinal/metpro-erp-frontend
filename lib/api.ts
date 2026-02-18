"use client";

export async function api(
  endpoint: string,
  options: RequestInit = {}
): Promise<unknown> {
  const rawBase = process.env.NEXT_PUBLIC_API_URL;
  if (!rawBase) throw new Error("Backend URL missing");

  const BASE_URL = rawBase.replace(/\/+$/, "");

  // Always get token
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Merge headers correctly
  const incomingHeaders = (options.headers as Record<string, string>) || {};

  const headers: Record<string, string> = {
    ...incomingHeaders,
  };

  // Attach token
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Only set JSON content-type if not FormData
  const isFormData = options.body instanceof FormData;
  if (!isFormData && !incomingHeaders["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  // IMPORTANT: options must be spread BEFORE headers
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: options.method || "GET",
    body: options.body || null,
    cache: "no-store",
    mode: "cors",
    headers, // headers LAST so nothing overwrites them
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return res.json().catch(() => null);
}