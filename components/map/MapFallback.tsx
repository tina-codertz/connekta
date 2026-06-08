import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { Column, Row, Text } from '@/components/ExpoUI';
import type { LocationObject } from '@/lib/location';
import { Colors } from '@/lib/theme';

interface MapFallbackProps {
  location: LocationObject | null;
  message?: string;
}

export function MapFallback({ location, message }: MapFallbackProps) {
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1E293B', '#0F172A']} style={styles.placeholder}>
        {message ? (
          <Text textStyle={styles.message}>{message}</Text>
        ) : null}
        {location && (
          <Column spacing={16} alignment="center" style={styles.center}>
            <Row spacing={8} alignment="center" style={styles.coordinates}>
              <Text textStyle={styles.coordinateText}>
                {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
              </Text>
              <View style={styles.accuracyBadge}>
                <Text textStyle={styles.accuracyText}>
                  +/-{location.coords.accuracy?.toFixed(0) || 0}m
                </Text>
              </View>
            </Row>
          </Column>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  message: {
    fontSize: 14,
    color: Colors.neutral[400],
    textAlign: 'center',
    marginBottom: 16,
  },
  center: { alignItems: 'center' },
  coordinates: {
    backgroundColor: Colors.neutral[800],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  coordinateText: {
    fontSize: 14,
    color: Colors.neutral[200],
    fontWeight: '500',
  },
  accuracyBadge: {
    backgroundColor: Colors.neutral[700],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  accuracyText: {
    fontSize: 12,
    color: Colors.neutral[400],
  },
});
