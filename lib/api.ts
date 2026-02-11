"use server";

export async function api(
  endpoint: string,
  options: RequestInit = {}
): Promise<unknown> {
  // Ensure backend URL exists
  const rawBase = process.env.NEXT_PUBLIC_API_URL;
  if (!rawBase) {
    throw new Error("Backend URL is not configured (NEXT_PUBLIC_API_URL missing)");
  }

  // Normalize URL (remove trailing slash)
  const BASE_URL = rawBase.replace(/\/+$/, "");

  // Token must be passed from client, not read here
  const headers: Record<string, string> = {};

  if (options.headers) {
    Object.assign(headers, options.headers as Record<string, string>);
  }

  const isFormData = options.body instanceof FormData;

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    cache: "no-store",
    mode: "cors",
  });

  if (res.status === 401) {
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    let message = "Request failed";

    try {
      const text = await res.text();
      message = text || message;
    } catch {}

    throw new Error(`API error ${res.status}: ${message}`);
  }

  try {
    return await res.json();
  } catch {
    return null;
  }
}