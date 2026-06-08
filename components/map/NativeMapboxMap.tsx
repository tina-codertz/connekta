import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  MapView,
  Camera,
  PointAnnotation,
  UserLocation,
  type CameraRef,
} from '@rnmapbox/maps';
import { getMapboxStyleUrl, isMapboxConfigured } from '@/lib/map-config';
import type { LocationObject } from '@/lib/location';
import { FriendMarker } from './types';
import { Place } from '@/types/database';
import { MapFallback } from './MapFallback';
import type { LocateMapHandle } from './locate-map.types';

interface NativeMapboxMapProps {
  location: LocationObject | null;
  friends: FriendMarker[];
  places: Place[];
  selectedFriendId: string | null;
}

export const NativeMapboxMap = forwardRef<LocateMapHandle, NativeMapboxMapProps>(
  function NativeMapboxMap({ location, friends, places, selectedFriendId }, ref) {
    const cameraRef = useRef<CameraRef>(null);
    const [zoom, setZoom] = useState(13);

    useImperativeHandle(ref, () => ({
      zoomIn: () => cameraRef.current?.zoomTo(zoom + 1, 250),
      zoomOut: () => cameraRef.current?.zoomTo(Math.max(zoom - 1, 2), 250),
      recenter: () => {
        if (!location) return;
        cameraRef.current?.setCamera({
          centerCoordinate: [location.coords.longitude, location.coords.latitude],
          zoomLevel: 14,
          animationDuration: 500,
        });
      },
    }));

    if (!isMapboxConfigured()) {
      return (
        <MapFallback
          location={location}
          message="Add EXPO_PUBLIC_MAPBOX_TOKEN to your .env file"
        />
      );
    }

    if (!location) {
      return <MapFallback location={null} message="Waiting for location..." />;
    }

    const center: [number, number] = [
      location.coords.longitude,
      location.coords.latitude,
    ];

    return (
      <View style={styles.container}>
        <MapView
          style={styles.map}
          styleURL={getMapboxStyleUrl()}
          compassEnabled={false}
          scaleBarEnabled={false}
          attributionEnabled
          logoEnabled={false}
          onCameraChanged={(state) => {
            if (state.properties?.zoom != null) {
              setZoom(state.properties.zoom);
            }
          }}
        >
          <Camera
            ref={cameraRef}
            centerCoordinate={center}
            zoomLevel={13}
            animationMode="flyTo"
            animationDuration={0}
          />

          <UserLocation visible showsUserHeadingIndicator />

          {friends.map((friend) => (
            <PointAnnotation
              key={friend.id}
              id={`friend-${friend.id}`}
              coordinate={[friend.longitude, friend.latitude]}
              title={friend.name}
            >
              <View
                style={[
                  styles.marker,
                  {
                    backgroundColor:
                      selectedFriendId === friend.id ? '#22C55E' : '#F59E0B',
                  },
                ]}
              />
            </PointAnnotation>
          ))}

          {places.map((place) => (
            <PointAnnotation
              key={place.id}
              id={`place-${place.id}`}
              coordinate={[Number(place.longitude), Number(place.latitude)]}
              title={place.name}
            >
              <View
                style={[styles.marker, { backgroundColor: place.color || '#8B5CF6' }]}
              />
            </PointAnnotation>
          ))}
        </MapView>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  marker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
