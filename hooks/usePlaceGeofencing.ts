import { useEffect, useRef } from 'react';
import type { LocationObject } from '@/lib/location';
import {
  createPlaceGeofenceAlert,
  getDisplayNameForGeofence,
  isInsidePlace,
  loadUserPlaces,
} from '@/lib/places';
import type { Place, Profile } from '@/types/database';

const ALERT_COOLDOWN_MS = 2 * 60 * 1000;

export function usePlaceGeofencing(
  userId: string | undefined,
  profile: Profile | null | undefined,
  location: LocationObject | null,
  locationSharingEnabled: boolean,
  placesVersion = 0
) {
  const placesRef = useRef<Place[]>([]);
  const presenceRef = useRef<Record<string, boolean>>({});
  const lastAlertRef = useRef<Record<string, number>>({});
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!userId) {
      placesRef.current = [];
      presenceRef.current = {};
      return;
    }

    loadUserPlaces(userId).then((places) => {
      placesRef.current = places;
      initializedRef.current = false;
      const nextPresence: Record<string, boolean> = {};
      places.forEach((place) => {
        nextPresence[place.id] = presenceRef.current[place.id] ?? false;
      });
      presenceRef.current = nextPresence;
    });
  }, [userId, placesVersion]);

  useEffect(() => {
    if (!userId || !location || !locationSharingEnabled) {
      return;
    }

    const { latitude, longitude } = location.coords;
    const userName = getDisplayNameForGeofence(profile);
    const now = Date.now();

    if (!initializedRef.current) {
      placesRef.current.forEach((place) => {
        presenceRef.current[place.id] = isInsidePlace(latitude, longitude, place);
      });
      initializedRef.current = true;
      return;
    }

    placesRef.current.forEach((place) => {
      const inside = isInsidePlace(latitude, longitude, place);
      const wasInside = presenceRef.current[place.id] ?? false;

      if (inside === wasInside) {
        return;
      }

      presenceRef.current[place.id] = inside;
      const type = inside ? 'arrival' : 'departure';
      const cooldownKey = `${place.id}:${type}`;
      const lastAlertAt = lastAlertRef.current[cooldownKey] ?? 0;

      if (now - lastAlertAt < ALERT_COOLDOWN_MS) {
        return;
      }

      lastAlertRef.current[cooldownKey] = now;
      createPlaceGeofenceAlert({
        place,
        userId,
        userName,
        type,
      });
    });
  }, [userId, profile, location, locationSharingEnabled]);
}
