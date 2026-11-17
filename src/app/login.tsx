import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Marca } from '@/components/marca';
import { useAuth } from '@/context/auth';

export default function Login() {
  const { iniciarSesion, entrarComoInvitado } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const puedeEnviar = email.trim().length > 0 && password.length > 0 && !enviando;

  const onSubmit = async () => {
    if (!puedeEnviar) return;
    setEnviando(true);
    setError(null);
    try {
      await iniciarSesion(email, password);
      // Stack.Protected redirige a "index" automáticamente al haber usuario
    } catch {
      setError('Correo o contraseña incorrectos, o no hay conexión con el servidor.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.logoContainer}>
            <Marca tamano={48} />
          </View>

          <Text style={styles.title}>Inicia sesión</Text>
          <Text style={styles.subtitle}>Consulta y rastrea tus envíos en tiempo real.</Text>

          <Text style={styles.label}>Correo electrónico</Text>
          <View style={styles.inputContainer}>
            <Feather name="mail" size={20} color="#18529D" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="tucorreo@ejemplo.com"
              placeholderTextColor="#9AA6B8"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!enviando}
            />
          </View>

          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.inputContainer}>
            <Feather name="lock" size={20} color="#18529D" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#9AA6B8"
              secureTextEntry={!verPassword}
              autoComplete="password"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={onSubmit}
              editable={!enviando}
            />
            <TouchableOpacity onPress={() => setVerPassword((v) => !v)} hitSlop={10}>
              <Feather name={verPassword ? 'eye-off' : 'eye'} size={20} color="#7A8B9E" />
            </TouchableOpacity>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.button, !puedeEnviar && styles.buttonDisabled]}
            onPress={onSubmit}
            disabled={!puedeEnviar}
          >
            {enviando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <View style={styles.separador}>
            <View style={styles.separadorLinea} />
            <Text style={styles.separadorTexto}>o</Text>
            <View style={styles.separadorLinea} />
          </View>

          <TouchableOpacity
            style={styles.buttonSecundario}
            onPress={entrarComoInvitado}
            disabled={enviando}
          >
            <Feather name="search" size={18} color="#18529D" />
            <Text style={styles.buttonSecundarioText}>Entrar sin cuenta</Text>
          </TouchableOpacity>
          <Text style={styles.ayudaInvitado}>Rastrea un envío solo con su folio.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F8FA',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  title: { fontSize: 26, fontWeight: 'bold', color: '#0B2B5B', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#5B7290', marginBottom: 32 },
  label: { fontSize: 13, fontWeight: '600', color: '#0B2B5B', marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6EDF5',
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 20,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15, color: '#0B2B5B' },
  errorText: { color: '#E53935', fontSize: 14, marginBottom: 16 },
  button: {
    backgroundColor: '#18529D',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  separador: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  separadorLinea: { flex: 1, height: 1, backgroundColor: '#E6EDF5' },
  separadorTexto: { marginHorizontal: 12, color: '#9AA6B8', fontSize: 14 },
  buttonSecundario: {
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#18529D',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonSecundarioText: { color: '#18529D', fontSize: 16, fontWeight: '600' },
  ayudaInvitado: { color: '#7A8B9E', fontSize: 13, textAlign: 'center', marginTop: 10 },
});
