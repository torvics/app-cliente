import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import * as Api from '@/services/auth';

type Usuario = Api.Usuario;

type AuthContextType = {
  usuario: Usuario | null; // null = invitado
  estaAutenticado: boolean;
  cargando: boolean;
  login: (correo: string, password: string) => Promise<void>;
  registrar: (nombre: string, correo: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';
const SESION_KEY = 'sesion_cliente';
const CUENTAS_KEY = 'cuentas_cliente';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const restaurar = async () => {
      try {
        if (USE_MOCK) {
          const raw = await AsyncStorage.getItem(SESION_KEY);
          if (raw) setUsuario(JSON.parse(raw));
        } else {
          const u = await Api.obtenerUsuario(); // la cookie manda
          if (u) setUsuario(u);
        }
      } finally {
        setCargando(false);
      }
    };
    restaurar();
  }, []);

  // --- Modo simulado (solo mientras USE_MOCK=true) ---
  const leerCuentas = async (): Promise<Record<string, { nombre: string; password: string }>> =>
    JSON.parse((await AsyncStorage.getItem(CUENTAS_KEY)) ?? '{}');

  const guardarSesionMock = async (u: Usuario) => {
    setUsuario(u);
    await AsyncStorage.setItem(SESION_KEY, JSON.stringify(u));
  };

  const registrar = async (nombre: string, correo: string, password: string) => {
    if (!USE_MOCK) throw new Error('El registro aún no está disponible.');
    const cuentas = await leerCuentas();
    const clave = correo.trim().toLowerCase();
    if (cuentas[clave]) throw new Error('Ya existe una cuenta con ese correo.');
    cuentas[clave] = { nombre: nombre.trim(), password };
    await AsyncStorage.setItem(CUENTAS_KEY, JSON.stringify(cuentas));
    await guardarSesionMock({ nombre: nombre.trim(), correo: clave });
  };

  const login = async (correo: string, password: string) => {
    if (USE_MOCK) {
      const cuentas = await leerCuentas();
      const clave = correo.trim().toLowerCase();
      const cuenta = cuentas[clave];
      if (!cuenta || cuenta.password !== password) {
        throw new Error('Correo o contraseña incorrectos.');
      }
      await guardarSesionMock({ nombre: cuenta.nombre, correo: clave });
      return;
    }
    setUsuario(await Api.login(correo.trim(), password));
  };

  const logout = async () => {
    if (!USE_MOCK) await Api.cerrarSesion().catch(() => {});
    setUsuario(null);
    await AsyncStorage.removeItem(SESION_KEY);
  };

  return (
    <AuthContext.Provider
      value={{ usuario, estaAutenticado: usuario !== null, cargando, login, registrar, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}