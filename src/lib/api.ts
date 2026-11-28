// Strip trailing slashes so "https://x.app/" + "/api/..." never becomes "//api/...".
const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "");

export async function api<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const isForm = typeof FormData !== "undefined" && options?.body instanceof FormData;
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: isForm ? options?.headers : { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  if (!res.ok) {
    const raw = await res.text();
    let message = raw;
    try {
      message = JSON.parse(raw).error || raw;
    } catch {
      /* plain-text error */
    }
    throw new Error(message || `Permintaan gagal (${res.status})`);
  }
  return res.json();
}

export const isAbort = (cause: unknown) => cause instanceof Error && cause.name === "AbortError";

export const errorMessage = (cause: unknown, fallback: string) => {
  if (cause instanceof TypeError) return "Layanan API tidak dapat dihubungi. Pastikan backend berjalan.";
  return cause instanceof Error && cause.message ? cause.message : fallback;
};

export const API_URL = API;
