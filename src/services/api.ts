export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://10.10.230.191:5272/api';

export const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

const TIMEOUT_MS = 8000;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  // Sin timeout, fetch en React Native puede tardar más de un minuto en fallar
  // si el backend no es alcanzable (IP incorrecta, otra red Wi-Fi, firewall).
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: options.signal ?? controller.signal,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    });
  } catch (e) {
    console.warn(`[api] No se pudo conectar con ${API_URL}${path}:`, e);
    throw new Error(`No se pudo conectar con el servidor (${API_URL}).`);
  } finally {
    clearTimeout(timeout);
  }

  const texto = await response.text();
  if (!response.ok) {
    throw new ApiError(response.status, texto || `Error ${response.status}`);
  }
  return texto ? JSON.parse(texto) : null;
}
