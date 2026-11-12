import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/services/api';
import {
  buscarPaquetePorFolio,
  normalizarFolio,
  obtenerCoordenadas,
  type Coordenadas,
  type Paquete,
} from '@/services/packages';

type Resultado = { paquete: Paquete; coords: Coordenadas | null };

type Mensaje =
  | { tipo: 'no-encontrado'; texto: string }
  | { tipo: 'error'; texto: string; folio: string }
  | { tipo: 'aviso'; texto: string };

const HERMOSILLO = { latitude: 29.08919, longitude: -110.96133 };
const EDGE_PADDING = { top: 80, right: 60, bottom: 260, left: 60 };

const colorEstado = (estado: string) => {
  const e = estado.toLowerCase();
  if (e.includes('entregado')) return '#0F9D58';
  if (e.includes('ruta')) return '#2563EB';
  return '#9AA6B8';
};

async function abrirEnMaps(coords: Coordenadas, etiqueta: string) {
  const { latitude: lat, longitude: lng } = coords;
  const label = encodeURIComponent(etiqueta);
  const nativa = Platform.select({
    ios: `maps:0,0?q=${label}&ll=${lat},${lng}`,
    android: `geo:0,0?q=${lat},${lng}(${label})`,
  });
  const web = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  try {
    await Linking.openURL(nativa ?? web);
  } catch {
    await Linking.openURL(web);
  }
}

export default function RastrearFolios() {
  const insets = useSafeAreaInsets();
  const { folio: folioParam } = useLocalSearchParams<{ folio?: string }>();
  const mapRef = useRef<MapView>(null);

  const [busqueda, setBusqueda] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);
  const [mostrarUbicacion, setMostrarUbicacion] = useState(false);
  const [localizando, setLocalizando] = useState(false);

  const centrarEn = useCallback((coords: Coordenadas) => {
    mapRef.current?.animateCamera({ center: coords, zoom: 16 }, { duration: 800 });
  }, []);

  const ajustarCamara = useCallback(
    (lista: Resultado[]) => {
      const coords = lista.flatMap((r) => (r.coords ? [r.coords] : []));
      if (coords.length === 1) centrarEn(coords[0]);
      else if (coords.length > 1) {
        mapRef.current?.fitToCoordinates(coords, { edgePadding: EDGE_PADDING, animated: true });
      }
    },
    [centrarEn]
  );

  const buscar = useCallback(
    async (entrada: string) => {
      const folio = normalizarFolio(entrada);
      if (!folio || buscando) return;
      Keyboard.dismiss();
      setMensaje(null);

      // Ya agregado: solo se centra
      const existente = resultados.find((r) => normalizarFolio(r.paquete.folio) === folio);
      if (existente) {
        setSeleccionado(existente.paquete.folio);
        setBusqueda('');
        if (existente.coords) centrarEn(existente.coords);
        return;
      }

      setBuscando(true);
      try {
        const paquete = await buscarPaquetePorFolio(folio);
        if (!paquete) {
          setMensaje({ tipo: 'no-encontrado', texto: `No encontramos el folio ${folio}` });
          return;
        }
        const coords = await obtenerCoordenadas(paquete);
        const nuevos = [...resultados, { paquete, coords }];
        setResultados(nuevos);
        setSeleccionado(paquete.folio);
        setBusqueda('');
        ajustarCamara(nuevos);
      } catch (e) {
        const sinSesion = e instanceof ApiError && (e.status === 401 || e.status === 403);
        setMensaje({
          tipo: 'error',
          texto: sinSesion
            ? 'Para buscar este folio necesitas iniciar sesión.'
            : 'No se pudo conectar con el servidor.',
          folio,
        });
      } finally {
        setBuscando(false);
      }
    },
    [ajustarCamara, buscando, centrarEn, resultados]
  );

  // Abrir la pantalla con un folio ya buscado (?folio=PKT-8492), una sola vez
  const folioInicialUsado = useRef(false);
  useEffect(() => {
    if (!folioParam || folioInicialUsado.current) return;
    folioInicialUsado.current = true;
    buscar(folioParam);
  }, [folioParam, buscar]);

  const quitar = (folio: string) => {
    const restantes = resultados.filter((r) => r.paquete.folio !== folio);
    setResultados(restantes);
    if (seleccionado === folio) setSeleccionado(null);
    ajustarCamara(restantes);
  };

  const seleccionar = (r: Resultado) => {
    setSeleccionado(r.paquete.folio);
    if (r.coords) centrarEn(r.coords);
  };

  const centrarEnMiUbicacion = async () => {
    if (localizando) return;
    setLocalizando(true);
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) {
        setMensaje({ tipo: 'aviso', texto: 'Sin permiso de ubicación no podemos mostrar dónde estás.' });
        return;
      }
      setMostrarUbicacion(true);
      const pos =
        (await Location.getLastKnownPositionAsync()) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      centrarEn({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    } catch {
      setMensaje({ tipo: 'aviso', texto: 'No pudimos obtener tu ubicación. Revisa que el GPS esté activo.' });
    } finally {
      setLocalizando(false);
    }
  };

  const actual = resultados.find((r) => r.paquete.folio === seleccionado) ?? null;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        showsUserLocation={mostrarUbicacion}
        showsMyLocationButton={false}
        onPress={() => Keyboard.dismiss()}
        initialRegion={{ ...HERMOSILLO, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
      >
        {resultados.map((r) =>
          r.coords ? (
            <Marker
              key={r.paquete.idPaquete}
              coordinate={r.coords}
              title={r.paquete.folio}
              description={r.paquete.direccionDestino}
              onPress={() => setSeleccionado(r.paquete.folio)}
            >
              <View
                style={[
                  styles.pin,
                  { backgroundColor: colorEstado(r.paquete.estadoActual) },
                  seleccionado === r.paquete.folio && styles.pinSeleccionado,
                ]}
              />
            </Marker>
          ) : null
        )}
      </MapView>

      {/* Buscador */}
      <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
        <View style={styles.searchRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <Feather name="arrow-left" size={22} color="#0B2B5B" />
          </TouchableOpacity>
          <View style={styles.inputContainer}>
            <Feather name="search" size={18} color="#18529D" />
            <TextInput
              style={styles.input}
              placeholder="Escribe tu folio, ej. PKT-8492"
              placeholderTextColor="#9AA6B8"
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="search"
              value={busqueda}
              onChangeText={setBusqueda}
              onSubmitEditing={() => buscar(busqueda)}
              editable={!buscando}
            />
          </View>
          <TouchableOpacity
            style={[styles.searchButton, (buscando || !busqueda.trim()) && styles.disabled]}
            onPress={() => buscar(busqueda)}
            disabled={buscando || !busqueda.trim()}
          >
            {buscando ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.searchButtonText}>Buscar</Text>
            )}
          </TouchableOpacity>
        </View>

        {resultados.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
            keyboardShouldPersistTaps="handled"
          >
            {resultados.map((r) => {
              const activo = r.paquete.folio === seleccionado;
              return (
                <TouchableOpacity
                  key={r.paquete.idPaquete}
                  style={[styles.chip, activo && styles.chipActivo]}
                  onPress={() => seleccionar(r)}
                >
                  <View style={[styles.chipDot, { backgroundColor: colorEstado(r.paquete.estadoActual) }]} />
                  <Text style={[styles.chipText, activo && styles.chipTextActivo]}>{r.paquete.folio}</Text>
                  {!r.coords && <Feather name="alert-triangle" size={12} color="#F5A623" />}
                  <TouchableOpacity onPress={() => quitar(r.paquete.folio)} hitSlop={8}>
                    <Feather name="x" size={14} color={activo ? '#FFFFFF' : '#7A8B9E'} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {mensaje && (
          <View style={[styles.mensaje, mensaje.tipo === 'error' && styles.mensajeError]}>
            <Feather
              name={mensaje.tipo === 'error' ? 'wifi-off' : mensaje.tipo === 'aviso' ? 'info' : 'search'}
              size={16}
              color="#FFFFFF"
            />
            <Text style={styles.mensajeText}>{mensaje.texto}</Text>
            {mensaje.tipo === 'error' && (
              <TouchableOpacity onPress={() => buscar(mensaje.folio)} disabled={buscando}>
                <Text style={styles.mensajeAccion}>Reintentar</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setMensaje(null)} hitSlop={8}>
              <Feather name="x" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Mi ubicación */}
      <TouchableOpacity
        style={[styles.locateButton, { bottom: (actual ? 230 : 32) + insets.bottom }]}
        onPress={centrarEnMiUbicacion}
      >
        {localizando ? (
          <ActivityIndicator color="#18529D" />
        ) : (
          <MaterialCommunityIcons name="crosshairs-gps" size={22} color="#18529D" />
        )}
      </TouchableOpacity>

      {/* Tarjeta del paquete seleccionado */}
      {actual && (
        <View style={[styles.card, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.cardHeader}>
            <View style={styles.flex}>
              <Text style={styles.cardFolio}>{actual.paquete.folio}</Text>
              <View style={styles.estadoRow}>
                <View style={[styles.chipDot, { backgroundColor: colorEstado(actual.paquete.estadoActual) }]} />
                <Text style={styles.estadoText}>{actual.paquete.estadoActual}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setSeleccionado(null)} hitSlop={10}>
              <Feather name="x" size={22} color="#7A8B9E" />
            </TouchableOpacity>
          </View>

          <View style={styles.direccionRow}>
            <Feather name="home" size={16} color="#18529D" />
            <Text style={styles.direccionText}>{actual.paquete.direccionDestino}</Text>
          </View>

          {(actual.paquete.esPrioritario || actual.paquete.esFragil) && (
            <View style={styles.badges}>
              {actual.paquete.esPrioritario && (
                <View style={[styles.badge, styles.badgePrioritario]}>
                  <Feather name="zap" size={12} color="#B26A00" />
                  <Text style={[styles.badgeText, styles.badgePrioritarioText]}>Prioritario</Text>
                </View>
              )}
              {actual.paquete.esFragil && (
                <View style={[styles.badge, styles.badgeFragil]}>
                  <MaterialCommunityIcons name="glass-fragile" size={12} color="#C62828" />
                  <Text style={[styles.badgeText, styles.badgeFragilText]}>Frágil</Text>
                </View>
              )}
            </View>
          )}

          {actual.coords ? (
            <TouchableOpacity
              style={styles.mapsButton}
              onPress={() => abrirEnMaps(actual.coords!, actual.paquete.folio)}
            >
              <Feather name="external-link" size={18} color="#FFFFFF" />
              <Text style={styles.mapsButtonText}>Abrir en Maps</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.sinUbicacion}>
              <Feather name="alert-triangle" size={16} color="#B26A00" />
              <Text style={styles.sinUbicacionText}>Ubicación no disponible</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const sombra = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 8,
  elevation: 4,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8EDF2' },
  flex: { flex: 1 },
  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 16, gap: 10 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...sombra,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
    ...sombra,
  },
  input: { flex: 1, fontSize: 14, color: '#0B2B5B' },
  searchButton: {
    height: 48,
    minWidth: 84,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: '#18529D',
    justifyContent: 'center',
    alignItems: 'center',
    ...sombra,
  },
  searchButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
  disabled: { opacity: 0.6 },
  chips: { gap: 8, paddingRight: 16 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...sombra,
  },
  chipActivo: { backgroundColor: '#18529D' },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontSize: 13, fontWeight: '600', color: '#0B2B5B' },
  chipTextActivo: { color: '#FFFFFF' },
  mensaje: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0B2B5B',
    borderRadius: 14,
    padding: 12,
    ...sombra,
  },
  mensajeError: { backgroundColor: '#C62828' },
  mensajeText: { flex: 1, color: '#FFFFFF', fontSize: 13, fontWeight: '500' },
  mensajeAccion: { color: '#FFFFFF', fontWeight: '700', fontSize: 13, textDecorationLine: 'underline' },
  pin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...sombra,
  },
  pinSeleccionado: { width: 30, height: 30, borderRadius: 15 },
  locateButton: {
    position: 'absolute',
    right: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...sombra,
  },
  card: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 14,
    ...sombra,
    elevation: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  cardFolio: { fontSize: 20, fontWeight: 'bold', color: '#0B2B5B', marginBottom: 4 },
  estadoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  estadoText: { fontSize: 14, color: '#5B7290', fontWeight: '500' },
  direccionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  direccionText: { flex: 1, fontSize: 14, color: '#0B2B5B' },
  badges: { flexDirection: 'row', gap: 8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
  badgePrioritario: { backgroundColor: '#FFF4E0' },
  badgePrioritarioText: { color: '#B26A00' },
  badgeFragil: { backgroundColor: '#FDECEA' },
  badgeFragilText: { color: '#C62828' },
  mapsButton: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#18529D',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapsButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  sinUbicacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF4E0',
    borderRadius: 12,
    padding: 12,
  },
  sinUbicacionText: { color: '#B26A00', fontWeight: '600' },
});
