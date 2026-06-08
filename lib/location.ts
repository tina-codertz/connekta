import { Platform } from 'react-native';

export interface LocationObject {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    altitude: number | null;
    speed: number | null;
    heading: number | null;
    altitudeAccuracy: number | null;
  };
  timestamp: number;
}

export interface PermissionResponse {
  status: 'granted' | 'denied' | 'undetermined';
  granted: boolean;
  canAskAgain: boolean;
  expires: 'never' | number;
}

// Default San Francisco location
const DEFAULT_LOCATION: LocationObject = {
  coords: {
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: 10,
    altitude: 0,
    speed: 0,
    heading: 0,
    altitudeAccuracy: null,
  },
  timestamp: Date.now(),
};

let NativeLocation: any = null;

// Try to load native expo-location if available
if (Platform.OS !== 'web') {
  try {
    NativeLocation = require('expo-location');
  } catch (e) {
    console.warn('expo-location not available, using mock:', e);
    NativeLocation = null;
  }
}

export const Location = {
  requestForegroundPermissionsAsync: async (): Promise<PermissionResponse> => {
    if (NativeLocation?.requestForegroundPermissionsAsync) {
      try {
        return await NativeLocation.requestForegroundPermissionsAsync();
      } catch (e) {
        console.warn('Error requesting permissions:', e);
        return { status: 'granted', granted: true, canAskAgain: true, expires: 'never' };
      }
    }
    return { status: 'granted', granted: true, canAskAgain: true, expires: 'never' };
  },

  getCurrentPositionAsync: async (): Promise<LocationObject> => {
    if (NativeLocation?.getCurrentPositionAsync) {
      try {
        return await NativeLocation.getCurrentPositionAsync();
      } catch (e) {
        console.warn('Error getting position:', e);
        return DEFAULT_LOCATION;
      }
    }
    return DEFAULT_LOCATION;
  },

  watchPositionAsync: async (
    options?: unknown,
    callback?: (location: LocationObject) => void
  ): Promise<{ remove: () => void }> => {
    if (NativeLocation?.watchPositionAsync) {
      try {
        return await NativeLocation.watchPositionAsync(options, callback ?? (() => {}));
      } catch (e) {
        console.warn('Error watching position:', e);
        return { remove: () => {} };
      }
    }
    return { remove: () => {} };
  },
};

export default Location;
