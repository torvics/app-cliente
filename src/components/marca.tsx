import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  /** Alto del logo en px; el texto escala con él. */
  tamano?: number;
};

/** Logo + nombre de la app: "Paq" en negritas y "Tracker" normal, como en el logo original. */
export function Marca({ tamano = 28 }: Props) {
  return (
    <View style={styles.contenedor} accessibilityRole="header" accessibilityLabel="PaqTracker">
      <Image
        source={require('@/assets/images/logo.png')}
        style={{ width: tamano, height: tamano }}
        contentFit="contain"
      />
      <Text style={[styles.texto, { fontSize: tamano * 0.72, marginLeft: tamano * 0.3 }]}>
        Paq<Text style={styles.textoLigero}>Tracker</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flexDirection: 'row', alignItems: 'center' },
  texto: { fontWeight: 'bold', color: '#0B2B5B' },
  textoLigero: { fontWeight: '400' },
});
