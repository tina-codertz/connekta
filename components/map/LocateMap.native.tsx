import React, { forwardRef } from 'react';
import { isNativeMapboxAvailable } from '@/lib/mapbox-native';
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

const NativeMapboxMap = isNativeMapboxAvailable()
  ? require('./NativeMapboxMap').NativeMapboxMap
  : null;

export const LocateMap = forwardRef<LocateMapHandle, LocateMapProps>(function LocateMap(
  props,
  ref
) {
  if (!NativeMapboxMap) {
    return (
      <MapFallback
        location={props.location}
        message="Native Mapbox requires a development build. Run: npx expo run:android or npx expo run:ios (Expo Go is not supported)."
      />
    );
  }

  return <NativeMapboxMap ref={ref} {...props} />;
});
