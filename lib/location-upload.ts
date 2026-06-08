import { supabase } from '@/lib/supabase';
import type { LocationObject } from '@/lib/location';

let activeUserId: string | null = null;

export function setActiveLocationUserId(userId: string | null) {
  activeUserId = userId;
}

export async function uploadLocationToSupabase(
  loc: LocationObject,
  userId?: string
): Promise<boolean> {
  const targetUserId = userId ?? activeUserId;
  if (!targetUserId) {
    return false;
  }

  const { error: locationError } = await supabase.from('locations').insert({
    user_id: targetUserId,
    latitude: loc.coords.latitude,
    longitude: loc.coords.longitude,
    accuracy: loc.coords.accuracy,
    speed: loc.coords.speed,
    heading: loc.coords.heading,
    altitude: loc.coords.altitude,
  });

  if (locationError) {
    console.warn('Failed to upload location:', locationError.message);
    return false;
  }

  await supabase
    .from('profiles')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', targetUserId);

  return true;
}
