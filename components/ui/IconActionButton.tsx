import React, { ReactNode } from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Colors } from '@/lib/theme';

type IconActionButtonVariant = 'default' | 'primary' | 'success' | 'muted';

interface IconActionButtonProps {
  onPress: () => void;
  children: ReactNode;
  variant?: IconActionButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

const variantStyles: Record<IconActionButtonVariant, ViewStyle> = {
  default: {
    backgroundColor: Colors.neutral[800],
  },
  primary: {
    backgroundColor: Colors.primary[900],
    borderWidth: 1,
    borderColor: Colors.primary[700],
  },
  success: {
    backgroundColor: Colors.secondary[600],
  },
  muted: {
    backgroundColor: Colors.neutral[700],
  },
};

export function IconActionButton({
  onPress,
  children,
  variant = 'default',
  disabled,
  loading,
  style,
}: IconActionButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, variantStyles[variant], style]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? <ActivityIndicator color={Colors.primary[400]} size="small" /> : children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
});
