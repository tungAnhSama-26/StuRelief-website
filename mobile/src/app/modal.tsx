import { StyleSheet, View, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Xác nhận thao tác</ThemedText>
      <ThemedText style={styles.description}>Bạn có chắc chắn muốn thực hiện hành động này không?</ThemedText>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.button, styles.cancelButton]}>
          <ThemedText style={styles.cancelText}>Hủy</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.confirmButton]}>
          <ThemedText style={styles.confirmText}>Xác nhận</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  description: {
    marginTop: 12,
    marginBottom: 24,
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12, // gap-3 in Tailwind
    width: '100%',
    justifyContent: 'center',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  confirmButton: {
    backgroundColor: '#2563eb',
  },
  cancelText: {
    color: '#374151',
    fontWeight: '600',
  },
  confirmText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
