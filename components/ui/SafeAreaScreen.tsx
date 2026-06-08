import React, { ReactNode } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { Colors } from '@/lib/theme';

interface SafeAreaScreenProps {
  children: ReactNode;
  edges?: Edge[];
  style?: ViewStyle;
}

export function SafeAreaScreen({
  children,
  edges = ['top'],
  style,
}: SafeAreaScreenProps) {
  return (
    <SafeAreaView edges={edges} style={[styles.screen, style]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.neutral[950],
  },
});
