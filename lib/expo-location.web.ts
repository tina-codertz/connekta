// Mock expo-location for web environments
// This module provides placeholder implementations for web platforms

export const Accuracy = {
  Lowest: 1,
  Low: 2,
  Balanced: 3,
  High: 4,
  Highest: 5,
  BestForNavigation: 6,
};

export function usePermissions() {
  return [{ granted: true }, async () => ({ granted: true })];
}

export function createPermissionHook() {
  return function useLocationPermission() {
    return [{ granted: true }, async () => ({ granted: true })];
  };
}

export async function requestForegroundPermissionsAsync() {
  return { granted: true, canAskAgain: false, expires: 'never' };
}

export async function requestBackgroundPermissionsAsync() {
  return { granted: true, canAskAgain: false, expires: 'never' };
}

export async function getForegroundPermissionsAsync() {
  return { granted: true, canAskAgain: false, expires: 'never' };
}

export async function getBackgroundPermissionsAsync() {
  return { granted: true, canAskAgain: false, expires: 'never' };
}

export async function getCurrentPositionAsync() {
  // Return a default position (San Francisco)
  return {
    coords: {
      latitude: 37.7749,
      longitude: -122.4194,
      altitude: 0,
      accuracy: 10,
      altitudeAccuracy: 0,
      heading: 0,
      speed: 0,
    },
    timestamp: Date.now(),
  };
}

export async function watchPositionAsync(options, callback) {
  // Return a subscription object that does nothing
  return {
    remove: () => {},
  };
}

export async function startLocationUpdatesAsync() {
  return;
}

export async function stopLocationUpdatesAsync() {
  return;
}

export async function hasStartedLocationUpdatesAsync() {
  return false;
}

export default {
  Accuracy,
  usePermissions,
  createPermissionHook,
  requestForegroundPermissionsAsync,
  requestBackgroundPermissionsAsync,
  getForegroundPermissionsAsync,
  getBackgroundPermissionsAsync,
  getCurrentPositionAsync,
  watchPositionAsync,
  startLocationUpdatesAsync,
  stopLocationUpdatesAsync,
  hasStartedLocationUpdatesAsync,
};
