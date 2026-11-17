import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Modal, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useRouter } from 'expo-router';

import { Marca } from '@/components/marca';
import { useAuth } from '@/context/auth';
import { usePaquetes } from '@/hooks/use-paquetes';

const esEntregado = (estado: string) => estado.toLowerCase().includes('entregado');

const iniciales = (nombre: string) =>
  nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'C';

export default function DashboardCliente() {
  
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const { usuario, esInvitado, cerrarSesion } = useAuth();
  const { paquetes, cargando, error, reintentar } = usePaquetes({ habilitado: !esInvitado });

  const nombre = usuario?.nombre ?? (esInvitado ? 'Invitado' : 'Cliente');

  const rastrear = () => {
    const folio = busqueda.trim().replace(/^#/, '');
    if (!folio) return;
    setBusqueda('');
    router.push({ pathname: '/rastrear', params: { folio } });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Feather name="menu" size={24} color="#0B2B5B" />
          </TouchableOpacity>
          
          <View style={styles.logoContainer}>
            <Marca tamano={30} />
          </View>
          
          <TouchableOpacity>
            <View style={styles.notificationDot} />
            <Feather name="bell" size={24} color="#0B2B5B" />
          </TouchableOpacity>
        </View>

        {/* Saludo */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>Hola,</Text>
          <Text style={styles.nameText}>{nombre}</Text>
        </View>

        {/* Tarjeta de Rastreo */}
        <View style={styles.trackingCard}>
          <View style={styles.trackingHeader}>
            <Feather name="package" size={16} color="#FFFFFF" />
            <Text style={styles.trackingHeaderText}>RASTREO EN TIEMPO REAL</Text>
          </View>
          <Text style={styles.trackingTitle}>Rastrea tu envío</Text>
          
          <View style={styles.inputContainer}>
            <Feather name="search" size={20} color="#18529D" style={styles.inputIcon} />
            <TextInput 
              style={styles.input}
              placeholder="Ingresa tu folio o código de rastreo"
              placeholderTextColor="#9AA6B8"
              autoCapitalize="characters"
              value={busqueda}
              onChangeText={setBusqueda}
              onSubmitEditing={rastrear}
              returnKeyType="search"
            />
          </View>
          
          <TouchableOpacity style={styles.trackButton} onPress={rastrear}>
            <Feather name="search" size={20} color="#18529D" />
            <Text style={styles.trackButtonText}>Rastrear Paquete</Text>
          </TouchableOpacity>
        </View>

        {/* Invitado: sin lista de envíos */}
        {esInvitado && (
          <View style={styles.estadoCard}>
            <MaterialCommunityIcons name="account-circle-outline" size={36} color="#18529D" />
            <Text style={styles.estadoText}>Inicia sesión para ver todos tus envíos.</Text>
            <TouchableOpacity onPress={cerrarSesion}>
              <Text style={styles.seeAllText}>Iniciar sesión</Text>
            </TouchableOpacity>
          </View>
        )}

        {!esInvitado && (<>
        {/* Envíos Recientes */}
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Envíos Recientes</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Envíos */}
        {cargando && <ActivityIndicator color="#18529D" style={{ marginVertical: 24 }} />}

        {!cargando && error && (
          <View style={styles.estadoCard}>
            <Text style={styles.estadoText}>No se pudieron cargar tus envíos.</Text>
            <TouchableOpacity onPress={reintentar}>
              <Text style={styles.seeAllText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {!cargando && !error && paquetes.length === 0 && (
          <View style={styles.estadoCard}>
            <Text style={styles.estadoText}>Aún no tienes envíos registrados.</Text>
          </View>
        )}

        {!cargando && !error && paquetes.map((paquete) => {
          const entregado = esEntregado(paquete.estadoActual);
          const etiquetas = [paquete.esPrioritario && 'Prioritario', paquete.esFragil && 'Frágil'].filter(Boolean);
          return (
          <TouchableOpacity 
            key={paquete.idPaquete} 
            style={styles.shipmentCard}
            onPress={() => router.push({ pathname: '/detalles', params: { folio: paquete.folio } })}
          >
            <View style={[
              styles.iconContainer, 
              entregado ? styles.iconEntregado : styles.iconTransito
            ]}>
              <MaterialCommunityIcons 
                name={entregado ? "package-variant-closed" : "truck-outline"} 
                size={24} 
                color={entregado ? "#2E7D32" : "#18529D"} 
              />
            </View>
            
            <View style={styles.shipmentInfo}>
              <Text style={styles.shipmentFolio}>Folio #{paquete.folio}</Text>
              <Text style={styles.shipmentDesc} numberOfLines={1}>{paquete.direccionDestino}</Text>
              {etiquetas.length > 0 && <Text style={styles.shipmentTags}>{etiquetas.join(' · ')}</Text>}
            </View>
            
            <View style={styles.shipmentAction}>
              <View style={[
                styles.badge, 
                entregado ? styles.badgeEntregado : styles.badgeTransito
              ]}>
                <Text style={[
                  styles.badgeText,
                  entregado ? styles.badgeTextEntregado : styles.badgeTextTransito
                ]}>{paquete.estadoActual}</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#C4C4C4" style={{ marginTop: 8 }} />
            </View>
          </TouchableOpacity>
          );
        })}
        </>)}

        {/* Menú Lateral (Modal) */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sideMenu}>
            
            <View style={styles.menuProfileSection}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{iniciales(nombre)}</Text>
              </View>
              <Text style={styles.profileName}>{nombre}</Text>
              <Text style={styles.profileType}>{usuario?.email || (esInvitado ? 'Sin cuenta' : 'Cliente')}</Text>
            </View>

            <View style={styles.menuLinks}>
              <TouchableOpacity style={styles.menuItem} onPress={() => setMenuVisible(false)}>
                <Feather name="home" size={22} color="#0B2B5B" />
                <Text style={styles.menuItemText}>Inicio</Text>
              </TouchableOpacity>
              
              {!esInvitado && (
                <TouchableOpacity style={styles.menuItem} onPress={() => setMenuVisible(false)}>
                  <Feather name="package" size={22} color="#0B2B5B" />
                  <Text style={styles.menuItemText}>Mis Envíos</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.menuItem} onPress={() => {
                setMenuVisible(false);
                router.push('/rastrear');
              }}>
                <Feather name="map" size={22} color="#0B2B5B" />
                <Text style={styles.menuItemText}>Rastrear en mapa</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => {
                setMenuVisible(false);
                router.push('/ayuda');
              }}>
                <Feather name="help-circle" size={22} color="#0B2B5B" />
                <Text style={styles.menuItemText}>Centro de Ayuda</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={() => {
              setMenuVisible(false);
              cerrarSesion();
            }}>
              {esInvitado ? (
                <>
                  <Feather name="log-in" size={22} color="#18529D" />
                  <Text style={[styles.logoutText, styles.loginText]}>Iniciar Sesión</Text>
                </>
              ) : (
                <>
                  <Feather name="log-out" size={22} color="#E53935" />
                  <Text style={styles.logoutText}>Cerrar Sesión</Text>
                </>
              )}
            </TouchableOpacity>
            
          </View>
          
          {/* Área oscura para cerrar el menú al tocar fuera de él */}
          <TouchableOpacity style={styles.closeOverlayArea} onPress={() => setMenuVisible(false)} activeOpacity={1} />
        </View>
      </Modal>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F8FA',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    right: 2,
    top: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F5A623',
    zIndex: 1,
  },
  greetingContainer: {
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 18,
    color: '#5B7290',
    marginBottom: 4,
  },
  nameText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0B2B5B',
  },
  trackingCard: {
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
  trackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  trackingHeaderText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginLeft: 8,
  },
  trackingTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0B2B5B',
  },
  trackButton: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackButtonText: {
    color: '#18529D',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B2B5B',
  },
  seeAllText: {
    fontSize: 14,
    color: '#18529D',
    fontWeight: '500',
  },
  shipmentCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconTransito: {
    backgroundColor: '#E6F0FA',
  },
  iconEntregado: {
    backgroundColor: '#E8F5E9',
  },
  shipmentInfo: {
    flex: 1,
  },
  shipmentFolio: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0B2B5B',
    marginBottom: 4,
  },
  shipmentDesc: {
    fontSize: 13,
    color: '#7A8B9E',
  },
  shipmentTags: {
    fontSize: 12,
    color: '#F5A623',
    fontWeight: '600',
    marginTop: 4,
  },
  estadoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  estadoText: {
    fontSize: 14,
    color: '#5B7290',
  },
  shipmentAction: {
    alignItems: 'flex-end',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeTransito: {
    backgroundColor: '#E6F0FA',
  },
  badgeEntregado: {
    backgroundColor: '#E8F5E9',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeTextTransito: {
    color: '#18529D',
  },
  badgeTextEntregado: {
    color: '#2E7D32',
  },
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sideMenu: {
    width: '75%',
    backgroundColor: '#FFFFFF',
    height: '100%',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 20 : 60,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  closeOverlayArea: {
    width: '25%',
    height: '100%',
  },
  menuProfileSection: {
    marginBottom: 40,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#18529D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B2B5B',
    marginBottom: 4,
  },
  profileType: {
    fontSize: 14,
    color: '#7A8B9E',
  },
  menuLinks: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  menuItemText: {
    fontSize: 16,
    color: '#0B2B5B',
    marginLeft: 16,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loginText: {
    color: '#18529D',
  },
  logoutText: {
    fontSize: 16,
    color: '#E53935',
    marginLeft: 16,
    fontWeight: '600',
  },
});