import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { getMapboxStyleUrl, isMapboxConfigured, mapConfig } from '@/lib/map-config';
import { buildMapMarkers, buildMapboxMapHtml } from '@/lib/mapbox-webview-html';
import type { LocationObject } from '@/lib/location';
import { FriendMarker } from './types';
import { Place } from '@/types/database';
import { MapFallback } from './MapFallback';
import type { LocateMapHandle } from './locate-map.types';

export type { LocateMapHandle };

interface LocateMapProps {
  location: LocationObject | null;
  friends: FriendMarker[];
  places: Place[];
  selectedFriendId: string | null;
}

export const LocateMap = forwardRef<LocateMapHandle, LocateMapProps>(function LocateMap(
  { location, friends, places, selectedFriendId },
  ref
) {
  const webViewRef = useRef<WebView>(null);

  const html = useMemo(() => {
    if (!location || !isMapboxConfigured()) return '';

    return buildMapboxMapHtml({
      accessToken: mapConfig.accessToken,
      styleUrl: getMapboxStyleUrl(),
      center: {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      },
      markers: buildMapMarkers(location, friends, places, selectedFriendId),
    });
  }, [location, friends, places, selectedFriendId]);

  useImperativeHandle(ref, () => ({
    zoomIn: () => webViewRef.current?.injectJavaScript('window.zoomIn(); true;'),
    zoomOut: () => webViewRef.current?.injectJavaScript('window.zoomOut(); true;'),
    recenter: () => webViewRef.current?.injectJavaScript('window.recenter(); true;'),
  }));

  if (!isMapboxConfigured()) {
    return <MapFallback location={location} message="Add EXPO_PUBLIC_MAPBOX_TOKEN to your .env file" />;
  }

  if (!location || !html) {
    return <MapFallback location={null} message="Waiting for location..." />;
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        setSupportMultipleWindows={false}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
});
