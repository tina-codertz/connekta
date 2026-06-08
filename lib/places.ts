import { supabase } from '@/lib/supabase';
import { getDisplayName } from '@/lib/profile';
import type { Place } from '@/types/database';

const EARTH_RADIUS_METERS = 6371000;

export function getDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

export function isInsidePlace(
  latitude: number,
  longitude: number,
  place: Pick<Place, 'latitude' | 'longitude' | 'radius'>
): boolean {
  const distance = getDistanceMeters(
    latitude,
    longitude,
    Number(place.latitude),
    Number(place.longitude)
  );
  return distance <= place.radius;
}

export async function loadUserPlaces(userId: string): Promise<Place[]> {
  const { data: memberships } = await supabase
    .from('circle_members')
    .select('circle_id')
    .eq('user_id', userId);

  if (!memberships?.length) {
    return [];
  }

  const circleIds = memberships.map((row) => row.circle_id);
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .in('circle_id', circleIds)
    .eq('notifications_enabled', true);

  if (error || !data) {
    return [];
  }

  return data;
}

export function isPlaceVisibleOnMap(place: Place): boolean {
  return place.visible_on_map ?? true;
}

export function getMapVisiblePlaces(places: Place[]): Place[] {
  return places.filter(isPlaceVisibleOnMap);
}

export async function deletePlace(placeId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('places').delete().eq('id', placeId);

  if (error) {
    return { error: new Error(error.message) };
  }

  return { error: null };
}

export async function updatePlaceSettings(
  placeId: string,
  settings: {
    visible_on_map?: boolean;
    notifications_enabled?: boolean;
  }
): Promise<{ data: Place | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('places')
    .update(settings)
    .eq('id', placeId)
    .select('*')
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as Place, error: null };
}

export async function createPlace(options: {
  circleId: string;
  name: string;
  latitude: number;
  longitude: number;
  radius?: number;
  address?: string | null;
  createdBy: string;
  visibleOnMap?: boolean;
  notificationsEnabled?: boolean;
}): Promise<{ data: Place | null; error: Error | null }> {
  const trimmedName = options.name.trim();
  if (!trimmedName) {
    return { data: null, error: new Error('Place name is required') };
  }

  const { data, error } = await supabase
    .from('places')
    .insert({
      circle_id: options.circleId,
      name: trimmedName,
      latitude: options.latitude,
      longitude: options.longitude,
      radius: options.radius ?? 100,
      address: options.address ?? null,
      created_by: options.createdBy,
      notifications_enabled: options.notificationsEnabled ?? true,
      visible_on_map: options.visibleOnMap ?? true,
    })
    .select('*')
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as Place, error: null };
}

export async function createPlaceGeofenceAlert(options: {
  place: Place;
  userId: string;
  userName: string;
  type: 'arrival' | 'departure';
}): Promise<void> {
  if (!options.place.notifications_enabled) {
    return;
  }

  const verb = options.type === 'arrival' ? 'arrived at' : 'left';
  const message = `${options.userName} ${verb} ${options.place.name}`;

  await supabase.from('alerts').insert({
    circle_id: options.place.circle_id,
    user_id: options.userId,
    place_id: options.place.id,
    type: options.type,
    message,
  });
}

export function getPlaceAlertLabel(
  type: 'arrival' | 'departure',
  userName: string,
  placeName: string
): string {
  return type === 'arrival'
    ? `${userName} arrived at ${placeName}`
    : `${userName} left ${placeName}`;
}

export function formatCoordinates(latitude: number, longitude: number): string {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

export async function reverseGeocodeLabel(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'LocateMate/1.0' },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { display_name?: string };
    return data.display_name ?? null;
  } catch {
    return null;
  }
}

export function getDisplayNameForGeofence(
  profile: { full_name: string | null; email: string } | null | undefined,
  fallback = 'Someone'
): string {
  return profile ? getDisplayName(profile) : fallback;
}
