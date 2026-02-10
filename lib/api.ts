export async function api(
  endpoint: string,
  options: RequestInit = {}
): Promise<unknown> {
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL as string;

  let token: string | null = null;

  if (typeof window !== "undefined") {
    token = localStorage.getItem("token");
  }

  // Always create a clean mutable header object
  const headers: Record<string, string> = {};

  // Copy user-provided headers safely
  if (options.headers) {
    Object.assign(headers, options.headers as Record<string, string>);
  }

  const isFormData = options.body instanceof FormData;

  // Only set JSON content-type when NOT uploading files
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  // Attach token if available
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    cache: "no-store",
    mode: "cors",
  });

  // Handle expired token
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    throw new Error("Unauthorized");
  }

  // Handle all other errors
  if (!res.ok) {
    let message = "Request failed";

    try {
      const text = await res.text();
      message = text || message;
    } catch {
      /* ignore */
    }

    throw new Error(`API error ${res.status}: ${message}`);
  }

  // Try to parse JSON, fallback to null
  try {
    return await res.json();
  } catch {
    return null;
  }
}