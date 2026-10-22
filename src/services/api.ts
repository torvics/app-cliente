export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.3.64:5272/api';

export async function apiFetch(path: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    });

    const texto = await response.text();

    if (!response.ok) {
      throw new Error(texto || `Error ${response.status}`);
    }

    return texto ? JSON.parse(texto) : null;
  } catch (e: any) {
    if (e?.name === 'AbortError') throw new Error('Network timeout');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}