import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

type Usuario = { nombre: string; correo: string };

type AuthContextType = {
  usuario: Usuario | null; // null = invitado
  cargando: boolean;
  login: (correo: string, password: string) => Promise<void>;
  registrar: (nombre: string, correo: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const SESION_KEY = 'sesion_cliente';
const CUENTAS_KEY = 'cuentas_cliente';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SESION_KEY)
      .then((raw) => raw && setUsuario(JSON.parse(raw)))
      .finally(() => setCargando(false));
  }, []);

  // SIMULADO: reemplazar por llamadas al backend Java cuando exista el endpoint
  const leerCuentas = async (): Promise<Record<string, { nombre: string; password: string }>> =>
    JSON.parse((await AsyncStorage.getItem(CUENTAS_KEY)) ?? '{}');

  const iniciarSesion = async (u: Usuario) => {
    setUsuario(u);
    await AsyncStorage.setItem(SESION_KEY, JSON.stringify(u));
  };

  const registrar = async (nombre: string, correo: string, password: string) => {
    const cuentas = await leerCuentas();
    const clave = correo.trim().toLowerCase();
    if (cuentas[clave]) throw new Error('Ya existe una cuenta con ese correo.');
    cuentas[clave] = { nombre: nombre.trim(), password };
    await AsyncStorage.setItem(CUENTAS_KEY, JSON.stringify(cuentas));
    await iniciarSesion({ nombre: nombre.trim(), correo: clave });
  };

  const login = async (correo: string, password: string) => {
    const cuentas = await leerCuentas();
    const clave = correo.trim().toLowerCase();
    const cuenta = cuentas[clave];
    if (!cuenta || cuenta.password !== password) throw new Error('Correo o contraseña incorrectos.');
    await iniciarSesion({ nombre: cuenta.nombre, correo: clave });
  };

  const logout = async () => {
    setUsuario(null);
    await AsyncStorage.removeItem(SESION_KEY);
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, registrar, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}