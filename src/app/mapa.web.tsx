import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// react-native-maps no funciona en web
export default function MapaWeb() {
  return (
    <View style={styles.container}>
      <Feather name="map" size={40} color="#9AA6B8" />
      <Text style={styles.text}>El mapa solo está disponible en la app de Android o iOS.</Text>
      <TouchableOpacity onPress={() => router.back()} style={styles.button}>
        <Text style={styles.buttonText}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32, backgroundColor: '#F5F8FA' },
  text: { fontSize: 16, color: '#0B2B5B', textAlign: 'center' },
  button: { backgroundColor: '#18529D', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  buttonText: { color: '#FFFFFF', fontWeight: '600' },
});
