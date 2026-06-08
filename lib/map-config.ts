/** Standard Mapbox street map. Override with EXPO_PUBLIC_MAPBOX_STYLE in .env */
const MAPBOX_STYLE = process.env.EXPO_PUBLIC_MAPBOX_STYLE ?? 'mapbox/streets-v12';

export const mapConfig = {
  provider: process.env.EXPO_PUBLIC_MAP_PROVIDER ?? 'mapbox',
  accessToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '',
  downloadsToken: process.env.MAPBOX_DOWNLOADS_TOKEN ?? '',
  style: MAPBOX_STYLE,
} as const;

export function isMapboxConfigured(): boolean {
  return mapConfig.provider === 'mapbox' && mapConfig.accessToken.length > 0;
}

/** Mapbox style URL for the native Mapbox SDK */
export function getMapboxStyleUrl(): string {
  return `mapbox://styles/${mapConfig.style}`;
}

/** HTTPS style URL for mapbox-gl (web + WebView fallback) */
export function getMapboxGlStyleUrl(): string {
  const token = mapConfig.accessToken;
  return `https://api.mapbox.com/styles/v1/${mapConfig.style}?access_token=${encodeURIComponent(token)}`;
}
