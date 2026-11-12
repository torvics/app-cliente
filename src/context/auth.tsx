import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import * as authService from '@/services/auth';
import type { Usuario } from '@/services/auth';

type AuthContextValue = {
  usuario: Usuario | null;
  estaAutenticado: boolean;
  /** Entró con "Entrar sin cuenta": puede rastrear por folio, pero no tiene lista de envíos. */
  esInvitado: boolean;
  cargando: boolean;
  iniciarSesion: (email: string, password: string) => Promise<void>;
  entrarComoInvitado: () => void;
  /** Cierra la sesión o sale del modo invitado; en ambos casos vuelve al login. */
  cerrarSesion: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [esInvitado, setEsInvitado] = useState(false);

  // Restaura la sesión (cookie) al abrir la app
  useEffect(() => {
    let activo = true;
    authService
      .obtenerUsuario()
      .then((u) => {
        if (activo) setUsuario(u);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const iniciarSesion = useCallback(async (email: string, password: string) => {
    const u = await authService.login(email.trim(), password);
    setUsuario(u);
    setEsInvitado(false);
  }, []);

  const entrarComoInvitado = useCallback(() => setEsInvitado(true), []);

  const cerrarSesion = useCallback(async () => {
    if (!usuario) {
      setEsInvitado(false);
      return;
    }
    try {
      await authService.cerrarSesion();
    } finally {
      // Aunque falle la petición, se limpia la sesión local
      setUsuario(null);
      setEsInvitado(false);
    }
  }, [usuario]);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        estaAutenticado: !!usuario,
        esInvitado,
        cargando,
        iniciarSesion,
        entrarComoInvitado,
        cerrarSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  return ctx;
}
