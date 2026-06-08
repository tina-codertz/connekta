import React, { ReactNode } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { Text } from '@/components/ExpoUI';
import { Colors } from '@/lib/theme';

interface GradientSubmitButtonProps {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
}

export function GradientSubmitButton({ label, onPress, icon }: GradientSubmitButtonProps) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.gradient}>
        {icon}
        <Text textStyle={styles.label}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 16,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  label: {
    color: Colors.neutral[0],
    fontSize: 16,
    fontWeight: '600',
  },
});
