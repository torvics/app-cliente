import { AuthProvider } from '@/context/auth-context';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="detalles" />
        <Stack.Screen name="rastreo" />
        <Stack.Screen name="ayuda" />
        <Stack.Screen name="login" options={{ presentation: 'modal' }} />
      </Stack>
    </AuthProvider>
  );
}