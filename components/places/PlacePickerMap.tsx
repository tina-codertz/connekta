import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { Text } from '@/components/ExpoUI';
import { isMapboxConfigured, mapConfig } from '@/lib/map-config';
import { buildPlacePickerHtml } from '@/lib/place-picker-html';
import { formatCoordinates } from '@/lib/places';
import { Colors } from '@/lib/theme';

interface PlacePickerMapProps {
  latitude: number;
  longitude: number;
  previewOnly?: boolean;
  height?: number;
  onCenterChange?: (latitude: number, longitude: number) => void;
}

export function PlacePickerMap({
  latitude,
  longitude,
  previewOnly = false,
  height = 200,
  onCenterChange,
}: PlacePickerMapProps) {
  const webViewRef = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [centerLabel, setCenterLabel] = useState(formatCoordinates(latitude, longitude));

  const mapKey = `${latitude.toFixed(5)}-${longitude.toFixed(5)}-${previewOnly ? 'preview' : 'pick'}`;

  const html = useMemo(() => {
    if (!isMapboxConfigured()) {
      return '';
    }

    return buildPlacePickerHtml(
      mapConfig.accessToken,
      { latitude, longitude },
      previewOnly
    );
  }, [mapKey, latitude, longitude, previewOnly]);

  useEffect(() => {
    setCenterLabel(formatCoordinates(latitude, longitude));
    if (!ready || previewOnly) {
      return;
    }

    const script = `
      (function () {
        if (window.setPickerLocation) {
          window.setPickerLocation({ latitude: ${latitude}, longitude: ${longitude} });
        }
      })();
      true;
    `;
    webViewRef.current?.injectJavaScript(script);
  }, [latitude, longitude, ready, previewOnly]);

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

      if (message.type === 'center' && !previewOnly) {
        const nextLatitude = Number(message.latitude);
        const nextLongitude = Number(message.longitude);
        onCenterChange?.(nextLatitude, nextLongitude);
        setCenterLabel(formatCoordinates(nextLatitude, nextLongitude));
      }
    } catch {
      // Ignore malformed messages.
    }
  }

  if (!isMapboxConfigured()) {
    return (
      <View style={[styles.fallback, { height }]}>
        <Text textStyle={styles.fallbackText}>
          Add EXPO_PUBLIC_MAPBOX_TOKEN to show this place on the map.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        key={mapKey}
        ref={webViewRef}
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
    height: 200,
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
    height: 200,
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
