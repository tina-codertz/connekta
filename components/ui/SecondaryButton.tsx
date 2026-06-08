import React, { ReactNode } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Text } from '@/components/ExpoUI';
import { Colors } from '@/lib/theme';

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function SecondaryButton({
  label,
  onPress,
  icon,
  style,
  fullWidth = true,
}: SecondaryButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, fullWidth && styles.fullWidth, style]}
      onPress={onPress}
    >
      {icon}
      <Text textStyle={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 16,
    backgroundColor: Colors.neutral[900],
    borderWidth: 1,
    borderColor: Colors.neutral[700],
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    color: Colors.neutral[0],
    fontSize: 16,
    fontWeight: '600',
  },
});
