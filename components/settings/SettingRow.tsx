import React, { ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Text } from '@/components/ExpoUI';
import { Colors } from '@/lib/theme';

interface SettingRowProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  trailing?: ReactNode;
  isLast?: boolean;
  style?: ViewStyle;
}

export function SettingRow({
  icon,
  title,
  subtitle,
  onPress,
  trailing,
  isLast,
  style,
}: SettingRowProps) {
  const content = (
    <>
      <View style={styles.icon}>{icon}</View>
      <View style={styles.text}>
        <Text textStyle={styles.title}>{title}</Text>
        {subtitle ? <Text textStyle={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {trailing ?? (onPress ? <ChevronRight size={20} color={Colors.neutral[500]} /> : null)}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={[styles.row, isLast && styles.last, style]} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.row, isLast && styles.last, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[800],
  },
  last: {
    borderBottomWidth: 0,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.neutral[800],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  text: { flex: 1 },
  title: {
    fontSize: 16,
    color: Colors.neutral[0],
  },
  subtitle: {
    fontSize: 12,
    color: Colors.neutral[500],
  },
});
