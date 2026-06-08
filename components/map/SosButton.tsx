import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { Text } from '@/components/ExpoUI';
import { Colors } from '@/lib/theme';

export function SosButton() {
  return (
    <TouchableOpacity style={styles.button}>
      <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.gradient}>
        <Text textStyle={styles.label}>SOS</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    color: Colors.neutral[0],
    fontWeight: '700',
  },
});
