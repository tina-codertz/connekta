/** Default map/search region: Tanzania */
export const TANZANIA_REGION = {
  name: 'Tanzania',
  center: {
    latitude: -6.7924,
    longitude: 39.2083,
  },
  bbox: {
    minLongitude: 29.34,
    minLatitude: -11.72,
    maxLongitude: 40.32,
    maxLatitude: -0.99,
  },
} as const;

export function getDefaultMapCenter(
  userLatitude?: number | null,
  userLongitude?: number | null
): { latitude: number; longitude: number } {
  if (typeof userLatitude === 'number' && typeof userLongitude === 'number') {
    const { bbox } = TANZANIA_REGION;
    const inTanzania =
      userLongitude >= bbox.minLongitude &&
      userLongitude <= bbox.maxLongitude &&
      userLatitude >= bbox.minLatitude &&
      userLatitude <= bbox.maxLatitude;

    if (inTanzania) {
      return { latitude: userLatitude, longitude: userLongitude };
    }
  }

  return { ...TANZANIA_REGION.center };
}
