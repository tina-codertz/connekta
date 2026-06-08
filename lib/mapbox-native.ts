import { NativeModules, Platform } from 'react-native';
import { mapConfig } from './map-config';

export function isNativeMapboxAvailable(): boolean {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    return NativeModules.RNMBXModule != null;
  } catch {
    return false;
  }
}

export function canUseNativeMapbox(): boolean {
  if (!isNativeMapboxAvailable()) {
    return false;
  }

  try {
    require('@rnmapbox/maps');
    return true;
  } catch {
    return false;
  }
}

let initialized = false;

export async function initNativeMapbox(): Promise<void> {
  if (!canUseNativeMapbox() || !mapConfig.accessToken || initialized) {
    return;
  }

  try {
    const Mapbox = require('@rnmapbox/maps').default;
    await Mapbox.setAccessToken(mapConfig.accessToken);
    initialized = true;
  } catch {
    // Fall back to the WebView map when the native SDK is not linked.
  }
}
