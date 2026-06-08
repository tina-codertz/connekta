import { NativeModules, Platform } from 'react-native';
import { mapConfig } from './map-config';

export function isNativeMapboxAvailable(): boolean {
  return Platform.OS !== 'web' && NativeModules.RNMBXModule != null;
}

let initialized = false;

export async function initNativeMapbox(): Promise<void> {
  if (!isNativeMapboxAvailable() || !mapConfig.accessToken || initialized) return;

  const Mapbox = require('@rnmapbox/maps').default;
  await Mapbox.setAccessToken(mapConfig.accessToken);
  initialized = true;
}
