import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import type { LocationObject } from '@/lib/location';
import { FriendMarker } from './types';
import { Place } from '@/types/database';
import { LocateMap } from './LocateMap';
import type { LocateMapHandle } from './locate-map.types';
import { MapControls } from './MapControls';
import { SosButton } from './SosButton';

interface MapPanelProps {
  location: LocationObject | null;
  friends: FriendMarker[];
  places: Place[];
  selectedFriendId: string | null;
}

export function MapPanel({ location, friends, places, selectedFriendId }: MapPanelProps) {
  const mapRef = useRef<LocateMapHandle>(null);

  return (
    <View style={styles.container}>
      <LocateMap
        ref={mapRef}
        location={location}
        friends={friends}
        places={places}
        selectedFriendId={selectedFriendId}
      />
      <MapControls
        onZoomIn={() => mapRef.current?.zoomIn()}
        onZoomOut={() => mapRef.current?.zoomOut()}
        onRecenter={() => mapRef.current?.recenter()}
      />
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
});
