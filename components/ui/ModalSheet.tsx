import React, { ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { X } from 'lucide-react-native';
import { Text } from '@/components/ExpoUI';
import { Colors } from '@/lib/theme';

interface ModalSheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function ModalSheet({ visible, title, onClose, children }: ModalSheetProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text textStyle={styles.title}>{title}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={Colors.neutral[400]} />
          </TouchableOpacity>
        </View>
        <View style={styles.body}>{children}</View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[950],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[800],
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.neutral[0],
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.neutral[800],
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flex: 1,
  },
});
