import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { mapConfig, isMapboxConfigured } from '@/lib/map-config';
import { buildMapboxWebViewHtml, toMapWebViewPayload } from '@/lib/mapbox-webview-html';
import type { LocationObject } from '@/lib/location';
import { FriendMarker } from './types';
import { Place } from '@/types/database';
import { MapFallback } from './MapFallback';
import type { LocateMapHandle } from './locate-map.types';

interface MapboxWebViewMapProps {
  location: LocationObject | null;
  friends: FriendMarker[];
  places: Place[];
  selectedFriendId: string | null;
}

export const MapboxWebViewMap = forwardRef<LocateMapHandle, MapboxWebViewMapProps>(
  function MapboxWebViewMap({ location, friends, places, selectedFriendId }, ref) {
    const webViewRef = useRef<WebView>(null);
    const [ready, setReady] = useState(false);
    const [mapError, setMapError] = useState<string | null>(null);

    const payload = useMemo(() => {
      if (!location) {
        return null;
      }

      return toMapWebViewPayload(
        location.coords.latitude,
        location.coords.longitude,
        friends,
        places.map((place) => ({
          id: place.id,
          name: place.name,
          latitude: Number(place.latitude),
          longitude: Number(place.longitude),
          color: place.color,
        })),
        selectedFriendId
      );
    }, [location, friends, places, selectedFriendId]);

    const html = useMemo(() => {
      if (!isMapboxConfigured()) {
        return '';
      }

      return buildMapboxWebViewHtml(mapConfig.accessToken, payload);
    }, [payload]);

    const sendToWebView = useCallback((message: object) => {
      const serialized = JSON.stringify(message);

      if (Platform.OS === 'android') {
        webViewRef.current?.injectJavaScript(`
          (function () {
            try {
              var parsed = JSON.parse(${JSON.stringify(serialized)});
              if (parsed.type === 'update' && parsed.payload && window.updateMap) {
                window.updateMap(parsed.payload);
              }
              if (parsed.type === 'command' && window.mapCommand) {
                window.mapCommand(parsed.command);
              }
            } catch (e) {}
          })();
          true;
        `);
        return;
      }

      webViewRef.current?.postMessage(serialized);
    }, []);

    useImperativeHandle(ref, () => ({
      zoomIn: () => sendToWebView({ type: 'command', command: 'zoomIn' }),
      zoomOut: () => sendToWebView({ type: 'command', command: 'zoomOut' }),
      recenter: () => sendToWebView({ type: 'command', command: 'recenter' }),
    }));

    useEffect(() => {
      if (!ready || !payload) {
        return;
      }

      sendToWebView({ type: 'update', payload });
    }, [ready, payload, sendToWebView]);

    const handleMessage = (event: WebViewMessageEvent) => {
      try {
        const message = JSON.parse(event.nativeEvent.data);
        if (message.type === 'ready') {
          setReady(true);
          setMapError(null);
        }
        if (message.type === 'error') {
          setMapError(message.message || 'Map failed to load');
        }
      } catch {
        // Ignore malformed messages from the WebView.
      }
    };

    if (!isMapboxConfigured()) {
      return (
        <MapFallback
          location={location}
          message="Add EXPO_PUBLIC_MAPBOX_TOKEN to your .env file, then restart the app."
        />
      );
    }

    if (!location || !payload) {
      return <MapFallback location={null} message="Waiting for your location..." />;
    }

    if (mapError) {
      return (
        <MapFallback
          location={location}
          message={`Map error: ${mapError}. Check your Mapbox token and internet connection.`}
        />
      );
    }

    return (
      <View style={styles.container}>
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html }}
          style={styles.webview}
          onMessage={handleMessage}
          onLoadEnd={() => {
            if (payload) {
              sendToWebView({ type: 'update', payload });
            }
          }}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          setSupportMultipleWindows={false}
          mixedContentMode="always"
          androidLayerType="hardware"
          cacheEnabled={false}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E7EB',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
