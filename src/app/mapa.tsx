import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { usePaquetes } from '@/hooks/use-paquetes';
import { parsearCoordenadas } from '@/services/packages';

type Coordenada = { latitude: number; longitude: number };

type RutaInfo = {
  puntos: Coordenada[];
  distancia: string;
  duracion: string;
  esFallback: boolean;
};

const HERMOSILLO: Coordenada = { latitude: 29.08919, longitude: -110.96133 };
const UMBRAL_DESVIO_M = 50;

// Distancia en metros (Haversine)
const calcularDistanciaMetros = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatearDistancia = (m: number) =>
  m > 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;

// Distancia mínima de un punto a la ruta, revisando 1 de cada 3 puntos
const distanciaARuta = (pos: Coordenada, puntos: Coordenada[]) => {
  let min = Infinity;
  for (let i = 0; i < puntos.length; i += 3) {
    const d = calcularDistanciaMetros(pos.latitude, pos.longitude, puntos[i].latitude, puntos[i].longitude);
    if (d < min) min = d;
  }
  return min;
};

// Ruta con OSRM público (sin API key). Si falla, línea recta.
async function calcularRuta(origen: Coordenada, destino: Coordenada): Promise<RutaInfo> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const url =
      `https://routing.openstreetmap.de/routed-car/route/v1/driving/` +
      `${origen.longitude},${origen.latitude};${destino.longitude},${destino.latitude}` +
      `?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route?.geometry?.coordinates?.length) throw new Error('Sin ruta');

    return {
      puntos: route.geometry.coordinates.map(([lng, lat]: [number, number]) => ({
        latitude: lat,
        longitude: lng,
      })),
      distancia: `${(route.distance / 1000).toFixed(1)} km`,
      duracion: `${Math.max(1, Math.round(route.duration / 60))} min`,
      esFallback: false,
    };
  } catch {
    const metros = calcularDistanciaMetros(
      origen.latitude,
      origen.longitude,
      destino.latitude,
      destino.longitude
    );
    return {
      puntos: [origen, destino],
      distancia: formatearDistancia(metros),
      duracion: '—',
      esFallback: true,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export default function Mapa() {
  const { folio } = useLocalSearchParams<{ folio?: string }>();
  const { cargando: cargandoPaquetes, error, reintentar, getPaqueteByFolio } = usePaquetes();
  const paquete = getPaqueteByFolio(folio);
  const destino = parsearCoordenadas(paquete?.coordenadasDestino);

  const mapRef = useRef<MapView>(null);
  const [ubicacion, setUbicacion] = useState<Coordenada | null>(null);
  const [ruta, setRuta] = useState<RutaInfo | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [permisoDenegado, setPermisoDenegado] = useState(false);

  // Refs para que el listener del GPS no use closures viejos
  const rutaRef = useRef<RutaInfo | null>(null);
  const recalculandoRef = useRef(false);

  const destinoKey = destino ? `${destino.latitude},${destino.longitude}` : null;

  useEffect(() => {
    const dest = parsearCoordenadas(destinoKey);
    if (!dest) return;
    let activo = true;
    let suscripcion: Location.LocationSubscription | null = null;

    const actualizarRuta = async (origen: Coordenada) => {
      if (recalculandoRef.current) return;
      recalculandoRef.current = true;
      setCalculando(true);
      try {
        const nueva = await calcularRuta(origen, dest);
        if (!activo) return;
        rutaRef.current = nueva;
        setRuta(nueva);
      } finally {
        recalculandoRef.current = false;
        if (activo) setCalculando(false);
      }
    };

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!activo) return;
      if (status !== 'granted') {
        setPermisoDenegado(true);
        return;
      }

      suscripcion = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 5 },
        (loc) => {
          if (!activo) return;
          const pos = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setUbicacion(pos);

          const rutaActual = rutaRef.current;
          if (!rutaActual) {
            actualizarRuta(pos); // primera posición
            return;
          }
          // Recálculo automático si el usuario se desvía de la ruta
          if (
            !rutaActual.esFallback &&
            !recalculandoRef.current &&
            distanciaARuta(pos, rutaActual.puntos) > UMBRAL_DESVIO_M
          ) {
            actualizarRuta(pos);
          }
        }
      );
      if (!activo) suscripcion.remove();
    })();

    return () => {
      activo = false;
      suscripcion?.remove();
      rutaRef.current = null;
    };
  }, [destinoKey]);

  const recentrar = () => {
    const centro = ubicacion ?? destino;
    if (!centro) return;
    mapRef.current?.animateCamera(
      { center: centro, zoom: 17.5, pitch: 55, heading: 0 },
      { duration: 1200 }
    );
  };

  // --- Estados sin mapa ---
  if (cargandoPaquetes) {
    return (
      <Centrado>
        <ActivityIndicator size="large" color="#18529D" />
        <Text style={styles.mensaje}>Cargando paquete...</Text>
      </Centrado>
    );
  }

  if (error) {
    return (
      <Centrado>
        <Feather name="wifi-off" size={40} color="#E53935" />
        <Text style={styles.mensaje}>No se pudo cargar la información del paquete.</Text>
        <BotonTexto texto="Reintentar" onPress={reintentar} />
      </Centrado>
    );
  }

  if (!paquete) {
    return (
      <Centrado>
        <MaterialCommunityIcons name="package-variant-remove" size={48} color="#9AA6B8" />
        <Text style={styles.mensaje}>Paquete no encontrado</Text>
      </Centrado>
    );
  }

  if (!destino) {
    return (
      <Centrado>
        <MaterialCommunityIcons name="map-marker-question-outline" size={48} color="#9AA6B8" />
        <Text style={styles.mensaje}>
          Este paquete aún no tiene coordenadas de destino, por lo que no se puede mostrar en el mapa.
        </Text>
        <Text style={styles.mensajeSecundario}>{paquete.direccionDestino}</Text>
      </Centrado>
    );
  }

  const preparando = !permisoDenegado && !ruta;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        showsUserLocation
        pitchEnabled
        initialRegion={{
          ...(destino ?? HERMOSILLO), // destino siempre existe aquí; Hermosillo como respaldo
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker coordinate={destino} title={`Folio ${paquete.folio}`} description={paquete.direccionDestino} />
        {ruta && <Polyline coordinates={ruta.puntos} strokeColor="#2563EB" strokeWidth={6} />}
      </MapView>

      {/* Header flotante */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Feather name="x" size={24} color="#0B2B5B" />
        </TouchableOpacity>
        <View style={styles.titlePill}>
          <Text style={styles.titleText}>Ruta a tu paquete</Text>
        </View>
        <TouchableOpacity onPress={recentrar} style={styles.iconButton}>
          <Feather name="navigation" size={20} color="#18529D" />
        </TouchableOpacity>
      </View>

      {permisoDenegado && (
        <View style={styles.aviso}>
          <Feather name="alert-circle" size={18} color="#FFFFFF" />
          <Text style={styles.avisoText}>
            Activa el permiso de ubicación para ver la ruta desde donde estás.
          </Text>
        </View>
      )}
      {ruta?.esFallback && (
        <View style={styles.aviso}>
          <Feather name="info" size={18} color="#FFFFFF" />
          <Text style={styles.avisoText}>
            No se pudo calcular la ruta por calles; se muestra la distancia en línea recta.
          </Text>
        </View>
      )}

      {preparando && (
        <View style={styles.cargandoOverlay}>
          <ActivityIndicator color="#18529D" />
          <Text style={styles.cargandoText}>Preparando ruta...</Text>
        </View>
      )}

      {/* Hoja inferior */}
      <View style={styles.bottomSheet}>
        <View style={styles.dragHandle} />
        <View style={styles.statusRow}>
          <View style={styles.truckIconContainer}>
            <MaterialCommunityIcons name="package-variant-closed" size={24} color="#18529D" />
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>Folio {paquete.folio}</Text>
            <Text style={styles.statusSubtitle}>{paquete.estadoActual}</Text>
          </View>
          {ruta && (
            <View style={styles.timeBadge}>
              <Text style={styles.timeBadgeText}>{ruta.esFallback ? ruta.distancia : ruta.duracion}</Text>
            </View>
          )}
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Feather name="home" size={18} color="#18529D" style={styles.detailIcon} />
            <View style={styles.flex}>
              <Text style={styles.detailLabel}>DESTINO</Text>
              <Text style={styles.detailValue}>{paquete.direccionDestino}</Text>
            </View>
          </View>
          {ruta && !ruta.esFallback && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Feather name="map-pin" size={18} color="#18529D" style={styles.detailIcon} />
                <View style={styles.flex}>
                  <Text style={styles.detailLabel}>DESDE TU UBICACIÓN</Text>
                  <Text style={styles.detailValue}>
                    {ruta.distancia} · {ruta.duracion} en auto{calculando ? ' · actualizando...' : ''}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

function Centrado({ children }: { children: ReactNode }) {
  return (
    <View style={styles.centrado}>
      <TouchableOpacity onPress={() => router.back()} style={[styles.iconButton, styles.cerrarCentrado]}>
        <Feather name="x" size={24} color="#0B2B5B" />
      </TouchableOpacity>
      {children}
    </View>
  );
}

function BotonTexto({ texto, onPress }: { texto: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.botonTexto}>
      <Text style={styles.botonTextoLabel}>{texto}</Text>
    </TouchableOpacity>
  );
}

const TOP = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 20 : 60;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8EDF2' },
  flex: { flex: 1 },
  centrado: {
    flex: 1,
    backgroundColor: '#F5F8FA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  cerrarCentrado: { position: 'absolute', top: TOP, left: 24 },
  mensaje: { fontSize: 16, fontWeight: '600', color: '#0B2B5B', textAlign: 'center' },
  mensajeSecundario: { fontSize: 14, color: '#7A8B9E', textAlign: 'center' },
  botonTexto: {
    marginTop: 8,
    backgroundColor: '#18529D',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  botonTextoLabel: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: TOP,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  titlePill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  titleText: { fontSize: 16, fontWeight: 'bold', color: '#0B2B5B' },
  aviso: {
    position: 'absolute',
    top: TOP + 64,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0F9D58',
    borderRadius: 14,
    padding: 14,
    elevation: 4,
  },
  avisoText: { flex: 1, color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  cargandoOverlay: {
    position: 'absolute',
    alignSelf: 'center',
    top: '40%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 4,
  },
  cargandoText: { color: '#0B2B5B', fontWeight: '600' },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  dragHandle: {
    width: 48,
    height: 4,
    backgroundColor: '#D1D9E6',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  truckIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#E6F0FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statusTextContainer: { flex: 1 },
  statusTitle: { fontSize: 16, fontWeight: 'bold', color: '#0B2B5B', marginBottom: 4 },
  statusSubtitle: { fontSize: 13, color: '#7A8B9E', paddingRight: 8 },
  timeBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timeBadgeText: { color: '#2E7D32', fontSize: 14, fontWeight: 'bold' },
  detailsCard: { backgroundColor: '#F4F7FB', borderRadius: 16, padding: 20 },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  detailIcon: { marginRight: 16 },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9AA6B8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: { fontSize: 14, fontWeight: 'bold', color: '#0B2B5B' },
  divider: { height: 1, backgroundColor: '#E6EDF5', marginVertical: 16, marginLeft: 34 },
});
