import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { usePaquetes } from '@/hooks/use-paquetes';

type PasoEstado = 'completado' | 'actual' | 'pendiente';

// Etapas genéricas del envío; la etapa actual se deriva de `estadoActual`
const ETAPAS = [
  { id: 1, titulo: 'Recibido en centro de distribución', icono: 'warehouse' },
  { id: 2, titulo: 'En camino a entrega', icono: 'truck-outline' },
  { id: 3, titulo: 'Entregado', icono: 'home-outline' },
] as const;

const indiceEtapa = (estado: string) => {
  const e = estado.toLowerCase();
  if (e.includes('entregado')) return ETAPAS.length; // todas completadas
  if (e.includes('ruta') || e.includes('camino') || e.includes('tránsito') || e.includes('transito')) return 1;
  return 0;
};

export default function DetallesEnvio() {
  const router = useRouter();
  const { folio } = useLocalSearchParams<{ folio?: string }>();
  const { cargando, error, reintentar, getPaqueteByFolio } = usePaquetes();
  const paquete = getPaqueteByFolio(folio);

  const header = (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Feather name="arrow-left" size={24} color="#0B2B5B" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Detalles del Envío</Text>
      <View style={{ width: 24 }} />
    </View>
  );

  if (cargando || error || !paquete) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>{header}</View>
        <View style={styles.estadoContainer}>
          {cargando ? (
            <ActivityIndicator size="large" color="#18529D" />
          ) : error ? (
            <>
              <Feather name="wifi-off" size={40} color="#E53935" />
              <Text style={styles.estadoText}>No se pudo cargar la información del envío.</Text>
              <TouchableOpacity onPress={reintentar}>
                <Text style={styles.reintentarText}>Reintentar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="package-variant-remove" size={48} color="#9AA6B8" />
              <Text style={styles.estadoText}>Paquete no encontrado</Text>
              {folio ? <Text style={styles.estadoSubText}>No hay un envío con el folio {folio}.</Text> : null}
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const actual = indiceEtapa(paquete.estadoActual);
  const entregado = actual >= ETAPAS.length;
  const historial = ETAPAS.map((etapa, i) => {
    const estado: PasoEstado = i < actual ? 'completado' : i === actual ? 'actual' : 'pendiente';
    return { ...etapa, estado };
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollFlex} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {header}

        {/* Tarjeta Principal Azul */}
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.folioText}>#{paquete.folio}</Text>
            <View style={styles.badgeActivo}>
              <View style={[styles.dotActivo, entregado && styles.dotFinalizado]} />
              <Text style={styles.badgeActivoText}>{entregado ? 'Finalizado' : 'Activo'}</Text>
            </View>
          </View>

          <Text style={styles.labelSmall}>ESTADO</Text>
          <Text style={styles.statusText}>{paquete.estadoActual}</Text>

          <View style={styles.divider} />

          <Text style={styles.labelSmall}>DESTINO</Text>
          <Text style={styles.infoText}>{paquete.direccionDestino}</Text>

          {(paquete.esPrioritario || paquete.esFragil) && (
            <View style={styles.tagsRow}>
              {paquete.esPrioritario && (
                <View style={styles.tag}>
                  <Feather name="zap" size={12} color="#FFFFFF" />
                  <Text style={styles.tagText}>Prioritario</Text>
                </View>
              )}
              {paquete.esFragil && (
                <View style={styles.tag}>
                  <MaterialCommunityIcons name="glass-fragile" size={12} color="#FFFFFF" />
                  <Text style={styles.tagText}>Frágil</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Progreso del Envío */}
        <Text style={styles.sectionTitle}>Progreso del envío</Text>

        <View style={styles.timelineContainer}>
          {historial.map((item, index) => {
            const colorFondo =
              item.estado === 'completado' ? '#2E7D32' : item.estado === 'actual' ? '#18529D' : '#F0F2F5';
            const colorTexto =
              item.estado === 'actual' ? '#18529D' : item.estado === 'pendiente' ? '#9AA6B8' : '#0B2B5B';
            return (
              <View key={item.id} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: colorFondo }]}>
                    <MaterialCommunityIcons
                      name={item.icono}
                      size={22}
                      color={item.estado === 'pendiente' ? '#9AA6B8' : '#FFFFFF'}
                    />
                  </View>
                  {index !== historial.length - 1 && (
                    <View
                      style={[
                        styles.timelineLine,
                        { backgroundColor: item.estado === 'completado' ? '#2E7D32' : '#E6EDF5' },
                      ]}
                    />
                  )}
                </View>

                <View style={styles.timelineRight}>
                  <Text style={[styles.timelineTitle, item.estado === 'pendiente' && styles.textoPendiente]}>
                    {item.titulo}
                  </Text>
                  <Text style={[styles.timelineSubtitle, { color: colorTexto }]}>
                    {item.estado === 'completado' ? 'Completado' : item.estado === 'actual' ? 'En curso' : 'Pendiente'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

      </ScrollView>

      {/* Botón Inferior */}
      {!entregado && (
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => router.push({ pathname: '/mapa', params: { folio: paquete.folio } })}
          >
            <Feather name="map-pin" size={20} color="#FFFFFF" style={styles.mapIcon} />
            <Text style={styles.mapButtonText}>Ver en mapa</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  dotFinalizado: {
    backgroundColor: '#90B4E2',
  },
  textoPendiente: {
    color: '#9AA6B8',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#356BB0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  estadoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  estadoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0B2B5B',
    textAlign: 'center',
  },
  estadoSubText: {
    fontSize: 14,
    color: '#7A8B9E',
    textAlign: 'center',
  },
  reintentarText: {
    fontSize: 15,
    color: '#18529D',
    fontWeight: '600',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollFlex: {
    flex: 1,
  },
  container: {
    padding: 24,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B2B5B',
  },
  mainCard: {
    backgroundColor: '#18529D',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#18529D',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  folioText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  badgeActivo: {
    flexDirection: 'row',
    backgroundColor: '#356BB0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  dotActivo: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  badgeActivoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  labelSmall: {
    color: '#90B4E2',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#356BB0',
    marginBottom: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B2B5B',
    marginBottom: 24,
  },
  timelineContainer: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 0, 
  },
  timelineLeft: {
    alignItems: 'center',
    width: 48,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  timelineLine: {
    width: 2,
    height: 40,
    marginTop: -4,
    marginBottom: -4,
    zIndex: 1,
  },
  timelineRight: {
    flex: 1,
    paddingLeft: 16,
    paddingTop: 4,
    paddingBottom: 24,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0B2B5B',
    marginBottom: 4,
  },
  timelineSubtitle: {
    fontSize: 13,
  },
  footerContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
  },
  mapButton: {
    flexDirection: 'row',
    backgroundColor: '#18529D',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapIcon: {
    marginRight: 8,
  },
  mapButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});