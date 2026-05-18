/**
 * Base URL du backend (sans suffixe /api).
 * Production / Render : https://golivraback.onrender.com (défaut si variable absente).
 */
export const DEFAULT_API_ORIGIN = "https://golivraback.onrender.com";

function resolveFallbackOrigin(): string {
  const proxyTarget = import.meta.env.VITE_PROXY_API_TARGET as string | undefined;
  if (proxyTarget?.trim()) {
    return proxyTarget.replace(/\/+$/, "");
  }
  return DEFAULT_API_ORIGIN;
}

export function getApiOrigin(): string {
  const raw = import.meta.env.VITE_PUBLIC_API_BASE_URL as string | undefined;
  if (raw === "" || raw === "/") {
    return resolveFallbackOrigin();
  }
  if (!raw?.trim()) {
    return resolveFallbackOrigin();
  }
  return raw.replace(/\/+$/, "");
}

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${getApiOrigin()}${p}`;
}

export type ApiFetchOptions = RequestInit & {
  token?: string | null;
  jsonBody?: unknown;
};

export async function apiFetch<T = unknown>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { token, jsonBody, headers: initHeaders, body, ...rest } = options;
  const headers = new Headers(initHeaders);

  let finalBody = body;
  if (jsonBody !== undefined) {
    headers.set('content-type', 'application/json');
    finalBody = JSON.stringify(jsonBody);
  }

  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
      ...rest,
      headers,
      body: finalBody,
    });
  } catch {
    const origin = getApiOrigin();
    const apiLabel = origin || "non configurée";
    const hint =
      origin.includes("localhost") || origin.includes("127.0.0.1")
          ? "Vérifiez que le backend tourne (cd golivra-backendcd && npm run dev, port 3000)."
          : "Vérifiez votre connexion et que le backend Render est actif. En local : VITE_PUBLIC_API_BASE_URL=http://localhost:3000 dans golivra-admin/.env.";
    throw new Error(`Impossible de joindre l'API (${apiLabel}). ${hint}`);
  }

  const text = await res.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    const msg =
      typeof parsed === 'object' && parsed !== null && 'message' in parsed
        ? String((parsed as { message: unknown }).message)
        : text || res.statusText;
    throw new Error(msg || `Erreur HTTP ${res.status}`);
  }

  return parsed as T;
}
