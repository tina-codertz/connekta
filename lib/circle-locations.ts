import { supabase } from '@/lib/supabase';
import { getDisplayName } from '@/lib/profile';
import type { FriendMarker } from '@/components/map/types';
import type { Location, Profile } from '@/types/database';

export function mapLocationToFriendMarker(
  profile: Profile,
  location: Location,
  selectedFriendId?: string | null
): FriendMarker {
  return {
    id: profile.id,
    name: getDisplayName(profile),
    latitude: Number(location.latitude),
    longitude: Number(location.longitude),
    battery: location.battery_level,
    isCharging: location.is_charging,
    lastSeen: location.recorded_at,
    avatar: profile.avatar_url,
  };
}

export async function fetchCircleMemberMarkers(
  circleId: string,
  currentUserId: string
): Promise<FriendMarker[]> {
  const { data: members } = await supabase
    .from('circle_members')
    .select('user_id, profiles!inner(*)')
    .eq('circle_id', circleId);

  if (!members?.length) {
    return [];
  }

  const otherMembers = members.filter((member) => member.user_id !== currentUserId);
  if (!otherMembers.length) {
    return [];
  }

  const markers = await Promise.all(
    otherMembers.map(async (member) => {
      const profile = member.profiles as Profile;
      const { data: locations } = await supabase
        .from('locations')
        .select('*')
        .eq('user_id', member.user_id)
        .order('recorded_at', { ascending: false })
        .limit(1);

      const latestLocation = locations?.[0];
      if (!latestLocation) {
        return null;
      }

      return mapLocationToFriendMarker(profile, latestLocation);
    })
  );

  return markers.filter((marker): marker is FriendMarker => marker !== null);
}

export async function fetchMemberMarkerForUser(
  userId: string
): Promise<FriendMarker | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) {
    return null;
  }

  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false })
    .limit(1);

  const latestLocation = locations?.[0];
  if (!latestLocation) {
    return null;
  }

  return mapLocationToFriendMarker(profile, latestLocation);
}
