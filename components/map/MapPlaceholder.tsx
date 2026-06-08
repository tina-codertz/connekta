import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { Column, Row, Text } from '@/components/ExpoUI';
import { type LocationObject } from '@/lib/location';
import { Colors } from '@/lib/theme';
import { MapControls } from './MapControls';
import { SosButton } from './SosButton';

interface MapPlaceholderProps {
  location: LocationObject | null;
}

export function MapPlaceholder({ location }: MapPlaceholderProps) {
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1E293B', '#0F172A']} style={styles.placeholder}>
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

            <View style={styles.youMarker}>
              <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.youMarkerGradient}>
                <Text textStyle={styles.youText}>You</Text>
              </LinearGradient>
              <View style={styles.youMarkerPulse} />
            </View>
          </Column>
        )}
      </LinearGradient>
      <MapControls />
      <SosButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    marginHorizontal: 24,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: { alignItems: 'center' },
  coordinates: {
    backgroundColor: Colors.neutral[800],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 24,
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
  youMarker: { alignItems: 'center' },
  youMarkerGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    zIndex: 2,
  },
  youText: {
    fontSize: 14,
    color: Colors.neutral[0],
    fontWeight: '600',
  },
  youMarkerPulse: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary[500],
    position: 'absolute',
    opacity: 0.3,
  },
});
