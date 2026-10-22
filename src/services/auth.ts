import { apiFetch } from './api';

export type Usuario = { nombre: string; correo: string };

// Tolera varios nombres de campo hasta que veamos la respuesta real del backend
const normalizar = (raw: any): Usuario => ({
  nombre: raw?.nombre ?? raw?.name ?? raw?.fullName ?? raw?.email ?? 'Cliente',
  correo: raw?.correo ?? raw?.email ?? '',
});

export async function login(correo: string, password: string): Promise<Usuario> {
  const raw = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: correo, password }),
  });
  console.log('LOGIN RAW:', JSON.stringify(raw)); // quitar cuando ya conozcamos la respuesta
  return normalizar(raw?.user ?? raw);
}

export async function obtenerUsuario(): Promise<Usuario | null> {
  try {
    return normalizar(await apiFetch('/auth/me'));
  } catch {
    return null; // 401 = sin sesión
  }
}

export const cerrarSesion = () => apiFetch('/auth/logout', { method: 'POST' });