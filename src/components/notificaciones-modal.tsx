import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type Notificacion = {
  id: string;
  icono: keyof typeof Feather.glyphMap;
  titulo: string;
  mensaje: string;
  hora: string;
  leida: boolean;
};

export function useNotificaciones() {
  // Datos de ejemplo: luego vendrán del backend
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([
    { id: '1', icono: 'truck', titulo: 'Tu paquete está cerca', mensaje: 'El repartidor llegará en aproximadamente 12 min.', hora: 'Hace 5 min', leida: false },
    { id: '2', icono: 'package', titulo: 'Paquete en ruta', mensaje: 'Tu pedido #PKT-8492 salió a entrega.', hora: 'Hace 1 h', leida: false },
    { id: '3', icono: 'check-circle', titulo: 'Pedido entregado', mensaje: 'El pedido #PKT-8377 fue entregado.', hora: 'Ayer', leida: true },
  ]);

  return {
    notificaciones,
    hayNoLeidas: notificaciones.some((n) => !n.leida),
    marcarLeida: (id: string) =>
      setNotificaciones((p) => p.map((n) => (n.id === id ? { ...n, leida: true } : n))),
    marcarTodas: () => setNotificaciones((p) => p.map((n) => ({ ...n, leida: true }))),
  };
}

type Props = {
  visible: boolean;
  onClose: () => void;
  notificaciones: Notificacion[];
  onMarcarLeida: (id: string) => void;
  onMarcarTodas: () => void;
};

export function NotificacionesModal({ visible, onClose, notificaciones, onMarcarLeida, onMarcarTodas }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.panel} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>Notificaciones</Text>
            <TouchableOpacity onPress={onMarcarTodas}>
              <Text style={styles.markAll}>Marcar leídas</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
            {notificaciones.map((n) => (
              <TouchableOpacity key={n.id} style={styles.item} onPress={() => onMarcarLeida(n.id)}>
                <View style={styles.iconCircle}>
                  <Feather name={n.icono} size={18} color="#18529D" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{n.titulo}</Text>
                  <Text style={styles.itemMsg}>{n.mensaje}</Text>
                  <Text style={styles.itemTime}>{n.hora}</Text>
                </View>
                {!n.leida && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'flex-end', paddingTop: (StatusBar.currentHeight ?? 44) + 60, paddingHorizontal: 16 },
  panel: { width: '92%', backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 8, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E6EDF5' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#0B2B5B' },
  markAll: { fontSize: 12, fontWeight: '600', color: '#18529D' },
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F2F5' },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E6F0FA', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemTitle: { fontSize: 14, fontWeight: 'bold', color: '#0B2B5B', marginBottom: 2 },
  itemMsg: { fontSize: 12, color: '#5B7290', marginBottom: 4 },
  itemTime: { fontSize: 11, color: '#9AA6B8' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E53935', marginLeft: 8 },
});