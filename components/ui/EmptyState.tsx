import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Column, RNHostView, Text } from '@/components/ExpoUI';
import { Colors } from '@/lib/theme';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Column spacing={16} alignment="center" style={styles.container}>
      <RNHostView matchContents>
        <View style={styles.iconWrapper}>{icon}</View>
      </RNHostView>
      <Text textStyle={styles.title}>{title}</Text>
      <Text textStyle={styles.description}>{description}</Text>
      {React.isValidElement(action) ? (
        <RNHostView matchContents>{action}</RNHostView>
      ) : (
        action
      )}
    </Column>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.neutral[900],
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.neutral[0],
  },
  description: {
    fontSize: 16,
    color: Colors.neutral[400],
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 22,
  },
});
