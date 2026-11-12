import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AuthProvider, useAuth } from '@/context/auth';

function RootNavigator() {
  const { usuario, esInvitado, cargando } = useAuth();
  const puedeEntrar = !!usuario || esInvitado;

  if (cargando) {
    return (
      <View style={styles.cargando}>
        <ActivityIndicator size="large" color="#18529D" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!puedeEntrar}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected guard={puedeEntrar}>
        <Stack.Screen name="index" />
        <Stack.Screen name="detalles" />
        <Stack.Screen name="mapa" />
        <Stack.Screen name="rastrear" />
        <Stack.Screen name="ayuda" />
        <Stack.Screen name="explore" />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  cargando: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F8FA' },
});

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
