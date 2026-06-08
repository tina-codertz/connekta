import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ZoomIn, ZoomOut, Locate } from 'lucide-react-native';
import { Column } from '@/components/ExpoUI';
import { Colors } from '@/lib/theme';

interface MapControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onRecenter?: () => void;
}

export function MapControls({ onZoomIn, onZoomOut, onRecenter }: MapControlsProps) {
  return (
    <Column spacing={8} style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={onZoomIn}>
        <ZoomIn size={20} color={Colors.neutral[300]} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={onZoomOut}>
        <ZoomOut size={20} color={Colors.neutral[300]} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={onRecenter}>
        <Locate size={20} color={Colors.primary[400]} />
      </TouchableOpacity>
    </Column>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral[800],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
