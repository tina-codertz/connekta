import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as ExpoLocation from 'expo-location';
import { BACKGROUND_LOCATION_TASK } from '@/lib/background-location-constants';
import {
  setActiveLocationUserId,
  uploadLocationToSupabase,
} from '@/lib/location-upload';
import type { LocationObject } from '@/lib/location';

const UPLOAD_INTERVAL_MS = 8_000;

const WATCH_OPTIONS: ExpoLocation.LocationOptions = {
  accuracy: ExpoLocation.Accuracy.Balanced,
  timeInterval: 10_000,
  distanceInterval: 25,
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

async function syncBackgroundLocationUpdates(enabled: boolean) {
  if (Platform.OS === 'web' || Constants.appOwnership === 'expo') {
    return;
  }

  const hasStarted = await ExpoLocation.hasStartedLocationUpdatesAsync(
    BACKGROUND_LOCATION_TASK
  );

  if (!enabled) {
    if (hasStarted) {
      await ExpoLocation.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }
    return;
  }

  const { status: foregroundStatus } =
    await ExpoLocation.requestForegroundPermissionsAsync();
  if (foregroundStatus !== 'granted') {
    return;
  }

  const { status: backgroundStatus } =
    await ExpoLocation.requestBackgroundPermissionsAsync();

  if (backgroundStatus !== 'granted') {
    return;
  }

  if (hasStarted) {
    return;
  }

  await ExpoLocation.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    accuracy: ExpoLocation.Accuracy.Balanced,
    timeInterval: 15_000,
    distanceInterval: 25,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'LocateMate',
      notificationBody: 'Sharing your location with your circle',
      notificationColor: '#3B82F6',
    },
  });
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

      await uploadLocationToSupabase(loc, userId);
    },
    [userId, locationSharingEnabled]
  );

  useEffect(() => {
    setActiveLocationUserId(locationSharingEnabled ? userId ?? null : null);
  }, [userId, locationSharingEnabled]);

  useEffect(() => {
    if (!userId || !locationSharingEnabled) {
      syncBackgroundLocationUpdates(false);
      return;
    }

    syncBackgroundLocationUpdates(true).catch((error) => {
      console.warn('Background location setup failed:', error);
    });

    return () => {
      syncBackgroundLocationUpdates(false).catch(() => undefined);
    };
  }, [userId, locationSharingEnabled]);

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

    if (!locationSharingEnabled) {
      return;
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
  }, [uploadLocation, locationSharingEnabled]);

  return { location, permissionGranted };
}
