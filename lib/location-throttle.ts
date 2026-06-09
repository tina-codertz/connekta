import type { LocationObject } from '@/lib/location';

export const LOCATION_UPLOAD_INTERVAL_MS = 12_000;
export const LOCATION_MIN_MOVE_METERS = 15;

type UploadSnapshot = {
  time: number;
  latitude: number;
  longitude: number;
};

let lastUploadSnapshot: UploadSnapshot | null = null;

function distanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function shouldUploadLocation(loc: LocationObject, now = Date.now()): boolean {
  const latitude = loc.coords.latitude;
  const longitude = loc.coords.longitude;

  if (!lastUploadSnapshot) {
    lastUploadSnapshot = { time: now, latitude, longitude };
    return true;
  }

  const elapsed = now - lastUploadSnapshot.time;
  const moved = distanceMeters(
    lastUploadSnapshot.latitude,
    lastUploadSnapshot.longitude,
    latitude,
    longitude
  );

  if (elapsed < LOCATION_UPLOAD_INTERVAL_MS && moved < LOCATION_MIN_MOVE_METERS) {
    return false;
  }

  lastUploadSnapshot = { time: now, latitude, longitude };
  return true;
}

export function resetLocationUploadThrottle() {
  lastUploadSnapshot = null;
}
