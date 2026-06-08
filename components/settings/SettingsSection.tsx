import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ExpoUI';
import { Colors } from '@/lib/theme';

interface SettingsSectionProps {
  title: string;
  children: ReactNode;
  noTopMargin?: boolean;
}

export function SettingsSection({ title, children, noTopMargin }: SettingsSectionProps) {
  return (
    <>
      <Text style={[styles.title, noTopMargin ? styles.titleFirst : undefined]}>{title}</Text>
      <View style={styles.content}>{children}</View>
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 14,
    color: Colors.neutral[500],
    marginBottom: 8,
    marginTop: 24,
    marginLeft: 4,
  },
  titleFirst: {
    marginTop: 0,
  },
  content: {
    borderRadius: 16,
    backgroundColor: Colors.neutral[900],
    overflow: 'hidden',
  },
});
