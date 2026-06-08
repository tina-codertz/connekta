const MAPBOX_STYLE = 'mapbox/dark-v11';

export const mapConfig = {
  provider: process.env.EXPO_PUBLIC_MAP_PROVIDER ?? 'mapbox',
  accessToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '',
  downloadsToken: process.env.MAPBOX_DOWNLOADS_TOKEN ?? '',
  style: MAPBOX_STYLE,
} as const;

export function isMapboxConfigured(): boolean {
  return mapConfig.provider === 'mapbox' && mapConfig.accessToken.length > 0;
}

/** Mapbox GL style URL for native SDK and web */
export function getMapboxStyleUrl(): string {
  return `mapbox://styles/${MAPBOX_STYLE}`;
}
