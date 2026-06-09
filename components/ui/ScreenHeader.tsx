import React, { ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ExpoUI';
import { useScreenInsets } from '@/hooks/useScreenInsets';
import { Colors } from '@/lib/theme';

interface ScreenHeaderProps {
  title: string;
  action?: ReactNode;
  compactTop?: boolean;
}

export function ScreenHeader({ title, action, compactTop }: ScreenHeaderProps) {
  const { headerPaddingTop } = useScreenInsets();

  return (
    <View
      style={[styles.header, { paddingTop: compactTop ? 16 : headerPaddingTop }]}
    >
      <Text textStyle={styles.title}>{title}</Text>
      {action}
    </View>
  );
}

interface HeaderActionButtonProps {
  onPress: () => void;
  children: ReactNode;
  accessibilityLabel?: string;
}

export function HeaderActionButton({
  onPress,
  children,
  accessibilityLabel,
}: HeaderActionButtonProps) {
  return (
    <TouchableOpacity
      style={styles.actionButton}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.neutral[0],
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
});
