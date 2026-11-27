const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
export async function api<T = any>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
export const API_URL = API;
