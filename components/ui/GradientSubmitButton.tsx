import React, { ReactNode } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { Text } from '@/components/ExpoUI';
import { Colors } from '@/lib/theme';

interface GradientSubmitButtonProps {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
  disabled?: boolean;
}

export function GradientSubmitButton({
  label,
  onPress,
  icon,
  style,
  fullWidth = true,
  disabled,
}: GradientSubmitButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, fullWidth && styles.fullWidth, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled}
    >
      <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.gradient}>
        {icon}
        <Text textStyle={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  label: {
    color: Colors.neutral[0],
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
});
