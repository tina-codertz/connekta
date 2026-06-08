import React, { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { Column } from '@/components/ExpoUI';

interface ActionButtonGroupProps {
  children: ReactNode;
}

export function ActionButtonGroup({ children }: ActionButtonGroupProps) {
  return <Column spacing={12} style={styles.group}>{children}</Column>;
}

const styles = StyleSheet.create({
  group: {
    width: '100%',
    paddingHorizontal: 8,
  },
});
