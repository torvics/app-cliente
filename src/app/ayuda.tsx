import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useAuth } from '@/context/auth-context';


export default function CentroAyuda() {
  const router = useRouter();
  const [motivoSeleccionado, setMotivoSeleccionado] = useState('no_llegado');
  const { usuario } = useAuth();


  const opcionesReporte = [
    { id: 'no_llegado', titulo: 'Mi paquete no ha llegado', icono: 'package-variant-closed' },
    { id: 'direccion', titulo: 'Dirección de entrega incorrecta', icono: 'map-marker-outline' },
    { id: 'danado', titulo: 'El paquete llegó dañado', icono: 'package-variant' },
  ];

  if (!usuario) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#F5F8FA' }}>
      <Feather name="lock" size={48} color="#5B7290" />
      <Text style={{ fontSize: 16, color: '#0B2B5B', textAlign: 'center', marginVertical: 16 }}>
        Inicia sesión para enviar un reporte sobre tu pedido.
      </Text>
      <TouchableOpacity
        style={{ backgroundColor: '#18529D', borderRadius: 14, height: 52, paddingHorizontal: 24, justifyContent: 'center' }}
        onPress={() => router.push('/login')}>
        <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Iniciar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}


  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flexContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Feather name="arrow-left" size={24} color="#0B2B5B" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Centro de Ayuda</Text>
            <View style={{ width: 24 }} />
          </View>

          <Text style={styles.descriptionText}>
            Selecciona el motivo de tu reporte. Nuestro equipo te contactará lo antes posible.
          </Text>

          {/* Tarjetas de Selección */}
          <View style={styles.cardsContainer}>
            {opcionesReporte.map((opcion) => {
              const isSelected = motivoSeleccionado === opcion.id;
              return (
                <TouchableOpacity
                  key={opcion.id}
                  style={[styles.card, isSelected && styles.cardSelected]}
                  onPress={() => setMotivoSeleccionado(opcion.id)}
                >
                  <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
                    <MaterialCommunityIcons
                      name={opcion.icono as any}
                      size={24}
                      color={isSelected ? '#FFFFFF' : '#18529D'}
                    />
                  </View>
                  <Text style={styles.cardText}>{opcion.titulo}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Formulario de Detalles */}
          <Text style={styles.formLabel}>Detalles del problema</Text>

          <TextInput
            style={styles.textInput}
            placeholder="Describe tu problema en detalle..."
            placeholderTextColor="#9AA6B8"
            multiline={true}
            textAlignVertical="top"
          />

          {/* Etiqueta de Folio */}
          <View style={styles.folioContainer}>
            <View style={styles.folioIconContainer}>
              <Text style={styles.folioIconText}>#</Text>
            </View>
            <Text style={styles.folioText}>Folio asociado: PKT-8492</Text>
          </View>

        </ScrollView>

        {/* Botón de Envío */}
        <View style={styles.footerContainer}>
          <TouchableOpacity style={styles.submitButton}>
            <Feather name="send" size={18} color="#FFFFFF" style={styles.submitIcon} />
            <Text style={styles.submitButtonText}>Enviar Reporte</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F7FB',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  flexContainer: {
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
  descriptionText: {
    fontSize: 14,
    color: '#5B7290',
    lineHeight: 20,
    marginBottom: 24,
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  card: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardSelected: {
    borderColor: '#18529D',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E6F0FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainerSelected: {
    backgroundColor: '#18529D',
  },
  cardText: {
    fontSize: 12,
    color: '#0B2B5B',
    textAlign: 'center',
    fontWeight: '500',
  },
  formLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0B2B5B',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    height: 140,
    fontSize: 14,
    color: '#0B2B5B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  folioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  folioIconContainer: {
    width: 24,
    height: 24,
    backgroundColor: '#E6F0FA',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  folioIconText: {
    color: '#18529D',
    fontSize: 12,
    fontWeight: 'bold',
  },
  folioText: {
    fontSize: 12,
    color: '#7A8B9E',
  },
  footerContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#F4F7FB',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#18529D',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});