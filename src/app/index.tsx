import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { NotificacionesModal, useNotificaciones } from '@/components/notificaciones-modal';
import { useAuth } from '@/context/auth-context';


import { useRouter } from 'expo-router';

export default function DashboardCliente() {
  const router = useRouter();
  const { usuario } = useAuth();
  const { notificaciones, hayNoLeidas, marcarLeida, marcarTodas } = useNotificaciones();
  const [notifVisible, setNotifVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const enviosRecientes = [
    { id: '1', folio: '#PKT-8492', desc: 'Paquete mediano · 2.4 kg', estado: 'En tránsito', tipo: 'transito' },
    { id: '2', folio: '#PKT-8377', desc: 'Sobre documentos · 0.1 kg', estado: 'Entregado', tipo: 'entregado' },
    { id: '3', folio: '#PKT-8210', desc: 'Paquete grande · 6.1 kg', estado: 'Entregado', tipo: 'entregado' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Feather name="menu" size={24} color="#0B2B5B" />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="truck-fast" size={28} color="#18529D" />
            <Text style={styles.logoText}>Rumbo<Text style={styles.logoTextLight}>Envíos</Text></Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => setNotifVisible(true)} style={{ padding: 4 }}>
              {hayNoLeidas && (
                <View style={{ position: 'absolute', right: 4, top: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#E53935', zIndex: 1 }} />
              )}
              <Feather name="bell" size={22} color="#0B2B5B" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/login')} style={{ padding: 4, marginLeft: 8 }}>
              <Feather name={usuario ? 'user-check' : 'user'} size={22} color="#0B2B5B" />
            </TouchableOpacity>
          </View>
        </View>
        {/* ↑ aquí se cierra el header */}

        {/* Saludo */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>Hola,</Text>
          <Text style={styles.nameText}>Ivan</Text>
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
            />
          </View>

          <TouchableOpacity style={styles.trackButton}>
            <Feather name="search" size={20} color="#18529D" />
            <Text style={styles.trackButtonText}>Rastrear Paquete</Text>
          </TouchableOpacity>
        </View>

        {/* Envíos Recientes */}
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Envíos Recientes</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {enviosRecientes.map((envio) => (
          <TouchableOpacity
            key={envio.id}
            style={styles.shipmentCard}
            onPress={() => {
              if (envio.folio === '#PKT-8492') {
                router.push('/detalles');
              }
            }}
          >
            <View style={[styles.iconContainer, envio.tipo === 'transito' ? styles.iconTransito : styles.iconEntregado]}>
              <MaterialCommunityIcons
                name={envio.tipo === 'transito' ? 'truck-outline' : 'package-variant-closed'}
                size={24}
                color={envio.tipo === 'transito' ? '#18529D' : '#2E7D32'}
              />
            </View>

            <View style={styles.shipmentInfo}>
              <Text style={styles.shipmentFolio}>Folio {envio.folio}</Text>
              <Text style={styles.shipmentDesc}>{envio.desc}</Text>
            </View>

            <View style={styles.shipmentAction}>
              <View style={[styles.badge, envio.tipo === 'transito' ? styles.badgeTransito : styles.badgeEntregado]}>
                <Text style={[styles.badgeText, envio.tipo === 'transito' ? styles.badgeTextTransito : styles.badgeTextEntregado]}>
                  {envio.estado}
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color="#C4C4C4" style={{ marginTop: 8 }} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
                <Text style={styles.avatarText}>JC</Text>
              </View>
              <Text style={styles.profileName}>Juan Carlos Perea</Text>
              <Text style={styles.profileType}>Cliente Estándar</Text>
            </View>

            <View style={styles.menuLinks}>
              <TouchableOpacity style={styles.menuItem} onPress={() => setMenuVisible(false)}>
                <Feather name="home" size={22} color="#0B2B5B" />
                <Text style={styles.menuItemText}>Inicio</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); router.push('/detalles'); }}>
                <Feather name="package" size={22} color="#0B2B5B" />
                <Text style={styles.menuItemText}>Mis Envíos</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); router.push('/ayuda'); }}>
                <Feather name="help-circle" size={22} color="#0B2B5B" />
                <Text style={styles.menuItemText}>Centro de Ayuda</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={() => setMenuVisible(false)}>
              <Feather name="log-out" size={22} color="#E53935" />
              <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.closeOverlayArea} onPress={() => setMenuVisible(false)} activeOpacity={1} />
        </View>
      </Modal>

      <NotificacionesModal
        visible={notifVisible}
        onClose={() => setNotifVisible(false)}
        notificaciones={notificaciones}
        onMarcarLeida={marcarLeida}
        onMarcarTodas={marcarTodas}
      />
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
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0B2B5B',
    marginLeft: 8,
  },
  logoTextLight: {
    fontWeight: '400',
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
  logoutText: {
    fontSize: 16,
    color: '#E53935',
    marginLeft: 16,
    fontWeight: '600',
  },
});