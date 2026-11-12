import * as Location from 'expo-location';
import { Platform } from 'react-native';

import { apiFetch, USE_MOCK } from './api';

export type Paquete = {
  idPaquete: number;
  folio: string;
  direccionDestino: string;
  esPrioritario: boolean;
  esFragil: boolean;
  estadoActual: string; // p. ej. "En ruta", "Entregado"
  // "lat,lng" (puede traer espacios). El backend aún no lo envía.
  coordenadasDestino?: string;
};

export type Coordenadas = { latitude: number; longitude: number };

export const MOCK_PAQUETES: Paquete[] = [
  {
    idPaquete: 101,
    folio: 'PKT-8492',
    direccionDestino: 'Aurora 79, Palmar del Sol, 83250 Hermosillo',
    coordenadasDestino: '29.0784056,-110.9808664',
    esPrioritario: true,
    esFragil: false,
    estadoActual: 'En ruta',
  },
  {
    idPaquete: 102,
    folio: 'PKT-8501',
    direccionDestino: 'Calle Reforma 8, Hermosillo',
    coordenadasDestino: '29.0915, -110.9650',
    esPrioritario: false,
    esFragil: true,
    estadoActual: 'En ruta',
  },
];

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isPaquete(value: unknown): value is Paquete {
  if (typeof value !== 'object' || value === null) return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.idPaquete === 'number' &&
    typeof p.folio === 'string' &&
    typeof p.direccionDestino === 'string' &&
    typeof p.esPrioritario === 'boolean' &&
    typeof p.esFragil === 'boolean' &&
    typeof p.estadoActual === 'string' &&
    (p.coordenadasDestino === undefined ||
      p.coordenadasDestino === null ||
      typeof p.coordenadasDestino === 'string')
  );
}

export async function obtenerPaquetes(): Promise<Paquete[]> {
  const response: unknown = await apiFetch('/packages');
  if (!Array.isArray(response) || !response.every(isPaquete)) {
    throw new Error('La respuesta de paquetes tiene un formato inesperado.');
  }
  return response;
}

/** "  #pkt-8492 " → "PKT-8492" */
export function normalizarFolio(folio: string): string {
  return folio.trim().replace(/^#/, '').toUpperCase();
}

/**
 * ÚNICO punto que cambia cuando exista `GET /packages/folio/{folio}`.
 * Hoy trae toda la lista y busca el folio en ella. Con el endpoint dedicado quedaría:
 *
 *   try {
 *     const raw: unknown = await apiFetch(`/packages/folio/${encodeURIComponent(folio)}`);
 *     if (!isPaquete(raw)) throw new Error('La respuesta del paquete tiene un formato inesperado.');
 *     return raw;
 *   } catch (e) {
 *     if (e instanceof ApiError && e.status === 404) return null;
 *     throw e;
 *   }
 */
async function pedirPaqueteAlBackend(folio: string): Promise<Paquete | null> {
  const paquetes = await obtenerPaquetes();
  return paquetes.find((p) => normalizarFolio(p.folio) === folio) ?? null;
}

/**
 * Busca un paquete por folio.
 * - Devuelve `null` si no existe.
 * - Lanza un error si falla la red, el servidor o el formato de la respuesta.
 */
export async function buscarPaquetePorFolio(folio: string): Promise<Paquete | null> {
  const normalizado = normalizarFolio(folio);
  if (!normalizado) return null;

  if (USE_MOCK) {
    await esperar(600);
    return MOCK_PAQUETES.find((p) => p.folio === normalizado) ?? null;
  }
  return pedirPaqueteAlBackend(normalizado);
}

/** Convierte "lat,lng" en coordenadas; devuelve null si el formato no es válido. */
export function parsearCoordenadas(valor?: string | null): Coordenadas | null {
  if (!valor) return null;
  const partes = valor.split(',').map((s) => s.trim());
  if (partes.length !== 2 || partes.some((s) => s === '')) return null;
  const [latitude, longitude] = partes.map(Number);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}

// Caché en memoria: geocodificar consume recursos y tiene límite de peticiones
const cacheGeocodificacion = new Map<string, Coordenadas | null>();

async function geocodificar(direccion: string): Promise<Coordenadas | null> {
  const clave = direccion.trim().toLowerCase();
  if (!clave) return null;
  if (cacheGeocodificacion.has(clave)) return cacheGeocodificacion.get(clave) ?? null;

  // En Android, geocodeAsync exige permiso de ubicación (doc de expo-location SDK 58).
  if (Platform.OS === 'android') {
    let permiso = await Location.getForegroundPermissionsAsync();
    if (!permiso.granted && permiso.canAskAgain) {
      permiso = await Location.requestForegroundPermissionsAsync();
    }
    if (!permiso.granted) return null; // no se guarda en caché: puede concederse después
  }

  try {
    const [primero] = await Location.geocodeAsync(direccion);
    const coords = primero ? { latitude: primero.latitude, longitude: primero.longitude } : null;
    cacheGeocodificacion.set(clave, coords);
    return coords;
  } catch (e) {
    console.warn('[geocodificación] Falló para', direccion, e);
    return null;
  }
}

/**
 * Coordenadas del destino: primero `coordenadasDestino`; si falta o es inválido,
 * geocodifica `direccionDestino`. Devuelve null si nada funciona.
 */
export async function obtenerCoordenadas(paquete: Paquete): Promise<Coordenadas | null> {
  const directas = parsearCoordenadas(paquete.coordenadasDestino);
  if (directas) return directas;
  if (Platform.OS === 'web') return null; // geocodeAsync solo existe en Android/iOS
  return geocodificar(paquete.direccionDestino);
}
