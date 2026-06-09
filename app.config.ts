import type { ConfigContext, ExpoConfig } from 'expo/config';

/** Native Mapbox SDK is iOS-only; Android uses WebView to avoid release APK launch crashes. */
const useNativeMapbox =
  process.env.EAS_BUILD_PLATFORM !== 'android' &&
  process.env.EXPO_ANDROID_NO_NATIVE_MAPBOX !== '1';

const mapboxPlugin: [string, { RNMapboxMapsVersion: string }] | null = useNativeMapbox
  ? ['@rnmapbox/maps', { RNMapboxMapsVersion: '11.20.1' }]
  : null;

export default (_context: ConfigContext): ExpoConfig => ({
  name: 'LocateMate',
  slug: 'locatemate',
  owner: 'christinakimario',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/app-logo.png',
  scheme: 'locatemate',
  userInterfaceStyle: 'dark',
  newArchEnabled: true,
  ios: {
    bundleIdentifier: 'com.christinakimario.locatemate',
    supportsTablet: true,
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'LocateMate needs your location to share it with your circles and friends.',
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'LocateMate needs your location to share it with your circles and friends.',
      NSLocationAlwaysUsageDescription:
        'LocateMate needs your location to share it with your circles and friends.',
      NSContactsUsageDescription:
        'LocateMate uses your contacts to help you find friends who already use the app.',
      LSApplicationQueriesSchemes: ['whatsapp'],
      UIBackgroundModes: ['location', 'remote-notification'],
    },
  },
  android: {
    package: 'com.christinakimario.locatemate',
    adaptiveIcon: {
      foregroundImage: './assets/app-logo.png',
      backgroundColor: '#0F172A',
    },
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'READ_CONTACTS',
      'POST_NOTIFICATIONS',
      'FOREGROUND_SERVICE',
      'FOREGROUND_SERVICE_LOCATION',
    ],
  },
  web: {
    bundler: 'metro',
    output: 'single',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-web-browser',
    ...(mapboxPlugin ? [mapboxPlugin] : []),
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'Allow LocateMate to share your location with your circle in the background.',
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/app-logo.png',
        color: '#3B82F6',
      },
    ],
    [
      'expo-contacts',
      {
        contactsPermission: 'Allow LocateMate to access your contacts to find friends.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: '0371e981-b7d1-4288-8b8f-463ca0f7df05',
    },
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    mapboxAccessToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN,
    mapProvider: process.env.EXPO_PUBLIC_MAP_PROVIDER ?? 'mapbox',
    appInviteUrl: process.env.EXPO_PUBLIC_APP_INVITE_URL,
    // Used only for native Mapbox SDK downloads during EAS/prebuild builds
    mapboxDownloadsToken: process.env.MAPBOX_DOWNLOADS_TOKEN,
  },
});
