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

/** Raster tile URL for react-native-maps UrlTile overlay */
export function getMapboxTileUrl(): string {
  const token = encodeURIComponent(mapConfig.accessToken);
  return `https://api.mapbox.com/styles/v1/${MAPBOX_STYLE}/tiles/256/{z}/{x}/{y}@2x?access_token=${token}`;
}

/** Mapbox GL style URL for web */
export function getMapboxStyleUrl(): string {
  return `mapbox://styles/${MAPBOX_STYLE}`;
}
