import React, { useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { Text } from '@/components/ExpoUI';
import { isMapboxConfigured, mapConfig } from '@/lib/map-config';
import { buildPlacePickerHtml } from '@/lib/place-picker-html';
import { formatCoordinates } from '@/lib/places';
import { Colors } from '@/lib/theme';

interface PlacePickerMapProps {
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  onCenterChange: (latitude: number, longitude: number) => void;
}

export function PlacePickerMap({
  initialLatitude,
  initialLongitude,
  onCenterChange,
}: PlacePickerMapProps) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [centerLabel, setCenterLabel] = useState('Move the map to choose a location');

  const html = useMemo(() => {
    if (!isMapboxConfigured()) {
      return '';
    }

    const hasCoords =
      typeof initialLatitude === 'number' && typeof initialLongitude === 'number';

    return buildPlacePickerHtml(
      mapConfig.accessToken,
      hasCoords
        ? { latitude: initialLatitude, longitude: initialLongitude }
        : null
    );
  }, [initialLatitude, initialLongitude]);

  function handleMessage(event: WebViewMessageEvent) {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      if (message.type === 'ready') {
        setReady(true);
        setError(null);
      }

      if (message.type === 'error') {
        setError(message.message || 'Map failed to load');
      }

      if (message.type === 'center') {
        const latitude = Number(message.latitude);
        const longitude = Number(message.longitude);
        onCenterChange(latitude, longitude);
        setCenterLabel(formatCoordinates(latitude, longitude));
      }
    } catch {
      // Ignore malformed messages.
    }
  }

  if (!isMapboxConfigured()) {
    return (
      <View style={styles.fallback}>
        <Text textStyle={styles.fallbackText}>
          Add EXPO_PUBLIC_MAPBOX_TOKEN to pick a place on the map.
        </Text>
      </View>
    );
  }

  if (
    typeof initialLatitude !== 'number' ||
    typeof initialLongitude !== 'number'
  ) {
    return (
      <View style={styles.fallback}>
        <Text textStyle={styles.fallbackText}>Waiting for your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        mixedContentMode="always"
        androidLayerType="hardware"
        cacheEnabled={false}
      />
      <View style={styles.coordsBadge} pointerEvents="none">
        <Text textStyle={styles.coordsText}>
          {ready ? centerLabel : 'Loading map...'}
        </Text>
      </View>
      {error ? (
        <View style={styles.errorBadge}>
          <Text textStyle={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: Colors.neutral[800],
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  coordsBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 10 : 8,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  coordsText: {
    fontSize: 12,
    color: Colors.neutral[0],
    textAlign: 'center',
  },
  fallback: {
    height: 220,
    borderRadius: 16,
    backgroundColor: Colors.neutral[900],
    borderWidth: 1,
    borderColor: Colors.neutral[800],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  fallbackText: {
    fontSize: 14,
    color: Colors.neutral[500],
    textAlign: 'center',
    lineHeight: 20,
  },
  errorBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: '#450A0A',
    borderRadius: 10,
    padding: 10,
  },
  errorText: {
    fontSize: 12,
    color: '#FCA5A5',
    textAlign: 'center',
  },
});
