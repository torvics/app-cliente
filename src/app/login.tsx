import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';

import { useAuth } from '@/context/auth-context';

export default function Login() {
  const router = useRouter();
  const { login, registrar } = useAuth();
  const [modoRegistro, setModoRegistro] = useState(false);
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    setError('');
    if (!correo.includes('@') || password.length < 6 || (modoRegistro && !nombre.trim())) {
      setError('Revisa los datos. La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    try {
      setEnviando(true);
      if (modoRegistro) await registrar(nombre, correo, password);
      else await login(correo, password);
      router.back();
    } catch (e: any) {
      setError(e.message ?? 'No se pudo completar la operación.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Feather name="x" size={24} color="#0B2B5B" />
          </TouchableOpacity>

          <Text style={styles.title}>{modoRegistro ? 'Crear cuenta' : 'Iniciar sesión'}</Text>
          <Text style={styles.subtitle}>
            Es opcional. Solo la necesitas para levantar reclamos sobre tus pedidos. Para rastrear
            basta con tu folio.
          </Text>

          {modoRegistro && (
            <TextInput style={styles.input} placeholder="Nombre completo" placeholderTextColor="#9AA6B8" value={nombre} onChangeText={setNombre} />
          )}
          <TextInput style={styles.input} placeholder="Correo electrónico" placeholderTextColor="#9AA6B8" keyboardType="email-address" autoCapitalize="none" value={correo} onChangeText={setCorreo} />
          <TextInput style={styles.input} placeholder="Contraseña" placeholderTextColor="#9AA6B8" secureTextEntry value={password} onChangeText={setPassword} />

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity style={styles.primaryButton} onPress={enviar} disabled={enviando}>
            {enviando ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>{modoRegistro ? 'Registrarme' : 'Entrar'}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setModoRegistro(!modoRegistro); setError(''); }}>
            <Text style={styles.link}>
              {modoRegistro ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.guestButton} onPress={() => router.back()}>
            <Text style={styles.guestText}>Continuar sin cuenta</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F8FA' },
  container: { padding: 24, paddingTop: 16 },
  closeButton: { alignSelf: 'flex-end', padding: 4, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#0B2B5B', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#5B7290', marginBottom: 24, lineHeight: 20 },
  input: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D9E6', borderRadius: 12,
    paddingHorizontal: 16, height: 56, fontSize: 16, color: '#0B2B5B', marginBottom: 12,
  },
  error: { color: '#E53935', fontSize: 13, marginBottom: 12 },
  primaryButton: {
    backgroundColor: '#18529D', borderRadius: 14, height: 56, justifyContent: 'center',
    alignItems: 'center', marginTop: 8, marginBottom: 16,
  },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  link: { color: '#18529D', fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 24 },
  guestButton: { height: 52, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#0B2B5B', borderRadius: 14 },
  guestText: { color: '#0B2B5B', fontSize: 15, fontWeight: '600' },
});