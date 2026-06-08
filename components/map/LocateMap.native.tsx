import React, { forwardRef, useMemo } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { canUseNativeMapbox } from '@/lib/mapbox-native';
import { isMapboxConfigured } from '@/lib/map-config';
import type { LocationObject } from '@/lib/location';
import { FriendMarker } from './types';
import { Place } from '@/types/database';
import { MapFallback } from './MapFallback';
import { MapboxWebViewMap } from './MapboxWebViewMap';
import type { LocateMapHandle } from './locate-map.types';

export type { LocateMapHandle };

interface LocateMapProps {
  location: LocationObject | null;
  friends: FriendMarker[];
  places: Place[];
  selectedFriendId: string | null;
}

function loadNativeMapboxMap() {
  // Native Mapbox SDK can crash on some Android release builds; WebView is more stable.
  if (Platform.OS === 'android' || !canUseNativeMapbox()) {
    return null;
  }

  try {
    return require('./NativeMapboxMap').NativeMapboxMap;
  } catch {
    return null;
  }
}

function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

export const LocateMap = forwardRef<LocateMapHandle, LocateMapProps>(function LocateMap(
  props,
  ref
) {
  const NativeMapboxMap = useMemo(() => loadNativeMapboxMap(), []);

  if (NativeMapboxMap) {
    return <NativeMapboxMap ref={ref} {...props} />;
  }

  if (isMapboxConfigured()) {
    return <MapboxWebViewMap ref={ref} {...props} />;
  }

  const message = isExpoGo()
    ? 'Add EXPO_PUBLIC_MAPBOX_TOKEN to your .env file, then restart Expo.'
    : 'Map unavailable. Add EXPO_PUBLIC_MAPBOX_TOKEN to your .env and rebuild with npm run ios or npm run android.';

  return <MapFallback location={props.location} message={message} />;
});
