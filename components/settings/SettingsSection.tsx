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
      <View style={[styles.titleWrap, noTopMargin ? styles.titleFirst : undefined]}>
        <Text textStyle={styles.title}>{title}</Text>
      </View>
      <View style={styles.content}>{children}</View>
    </>
  );
}

const styles = StyleSheet.create({
  titleWrap: {
    marginBottom: 8,
    marginTop: 24,
    marginLeft: 4,
  },
  titleFirst: {
    marginTop: 0,
  },
  title: {
    fontSize: 14,
    color: Colors.neutral[500],
  },
  content: {
    borderRadius: 16,
    backgroundColor: Colors.neutral[900],
    overflow: 'hidden',
  },
});
