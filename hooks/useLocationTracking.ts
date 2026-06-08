import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as ExpoLocation from 'expo-location';
import { supabase } from '@/lib/supabase';
import type { LocationObject } from '@/lib/location';

const UPLOAD_INTERVAL_MS = 30_000;

const WATCH_OPTIONS: ExpoLocation.LocationOptions = {
  accuracy: ExpoLocation.Accuracy.Balanced,
  timeInterval: 10_000,
  distanceInterval: 50,
};

function webPositionToLocation(position: GeolocationPosition): LocationObject {
  return {
    coords: {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      speed: position.coords.speed,
      heading: position.coords.heading,
      altitudeAccuracy: position.coords.altitudeAccuracy,
    },
    timestamp: position.timestamp,
  };
}

export function useLocationTracking(
  userId: string | undefined,
  locationSharingEnabled: boolean
) {
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const lastUploadRef = useRef(0);

  const uploadLocation = useCallback(
    async (loc: LocationObject) => {
      if (!userId || !locationSharingEnabled) return;

      const now = Date.now();
      if (now - lastUploadRef.current < UPLOAD_INTERVAL_MS) return;
      lastUploadRef.current = now;

      const { error: locationError } = await supabase.from('locations').insert({
        user_id: userId,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
        speed: loc.coords.speed,
        heading: loc.coords.heading,
        altitude: loc.coords.altitude,
      });

      if (locationError) {
        console.warn('Failed to upload location:', locationError.message);
        return;
      }

      await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', userId);
    },
    [userId, locationSharingEnabled]
  );

  useEffect(() => {
    let watchSubscription: ExpoLocation.LocationSubscription | null = null;
    let webWatchId: number | null = null;

    async function startNativeTracking() {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setPermissionGranted(granted);
      if (!granted) return;

      const current = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });
      setLocation(current);
      await uploadLocation(current);

      watchSubscription = await ExpoLocation.watchPositionAsync(
        WATCH_OPTIONS,
        (loc) => {
          setLocation(loc);
          uploadLocation(loc);
        }
      );
    }

    function startWebTracking() {
      if (!navigator?.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = webPositionToLocation(position);
          setLocation(loc);
          setPermissionGranted(true);
          uploadLocation(loc);
        },
        () => setPermissionGranted(false),
        { enableHighAccuracy: true }
      );

      webWatchId = navigator.geolocation.watchPosition(
        (position) => {
          const loc = webPositionToLocation(position);
          setLocation(loc);
          setPermissionGranted(true);
          uploadLocation(loc);
        },
        () => setPermissionGranted(false),
        { enableHighAccuracy: true, maximumAge: 10_000 }
      );
    }

    if (Platform.OS === 'web') {
      startWebTracking();
    } else {
      startNativeTracking();
    }

    return () => {
      watchSubscription?.remove();
      if (webWatchId !== null && navigator?.geolocation) {
        navigator.geolocation.clearWatch(webWatchId);
      }
    };
  }, [uploadLocation]);

  return { location, permissionGranted };
}
