import { supabase } from '@/lib/supabase';
import { getDisplayName } from '@/lib/profile';
import type { CircleMemberLocation, FriendMarker } from '@/components/map/types';

type CircleMemberLocationRow = {
  user_id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  is_location_enabled: boolean;
  battery_level: number | null;
  is_charging: boolean;
  last_seen: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  recorded_at: string | null;
  location_id: string | null;
};

function mapRowToCircleMember(
  row: CircleMemberLocationRow,
  viewerSharing: boolean
): CircleMemberLocation {
  const isSharing = row.is_location_enabled ?? true;
  const hasCoordinates = row.latitude !== null && row.longitude !== null;
  const canViewLocation = viewerSharing && isSharing && hasCoordinates;

  return {
    id: row.user_id,
    name: getDisplayName({
      full_name: row.full_name,
      email: row.email,
    }),
    avatar: row.avatar_url,
    isSharing,
    canViewLocation,
    latitude: canViewLocation ? Number(row.latitude) : null,
    longitude: canViewLocation ? Number(row.longitude) : null,
    battery: row.battery_level,
    isCharging: row.is_charging ?? false,
    lastSeen: row.recorded_at ?? row.last_seen,
  };
}

export function circleMemberToMapMarker(
  member: CircleMemberLocation
): FriendMarker | null {
  if (!member.canViewLocation || member.latitude === null || member.longitude === null) {
    return null;
  }

  return {
    id: member.id,
    name: member.name,
    latitude: member.latitude,
    longitude: member.longitude,
    battery: member.battery,
    isCharging: member.isCharging,
    lastSeen: member.lastSeen ?? new Date().toISOString(),
    avatar: member.avatar,
  };
}

export function circleMembersToMapMarkers(
  members: CircleMemberLocation[]
): FriendMarker[] {
  return members
    .map(circleMemberToMapMarker)
    .filter((marker): marker is FriendMarker => marker !== null);
}

export async function fetchCircleMembers(
  circleId: string,
  viewerSharing: boolean
): Promise<CircleMemberLocation[]> {
  const { data, error } = await supabase.rpc('get_circle_member_locations', {
    p_circle_id: circleId,
  });

  if (error) {
    console.warn('Failed to fetch circle member locations:', error.message);
    return fetchCircleMembersFallback(circleId, viewerSharing);
  }

  return ((data as CircleMemberLocationRow[] | null) ?? []).map((row) =>
    mapRowToCircleMember(row, viewerSharing)
  );
}

async function fetchCircleMembersFallback(
  circleId: string,
  viewerSharing: boolean
): Promise<CircleMemberLocation[]> {
  const { data: members } = await supabase
    .from('circle_members')
    .select('user_id, profiles!inner(*)')
    .eq('circle_id', circleId);

  if (!members?.length) {
    return [];
  }

  const { data: auth } = await supabase.auth.getUser();
  const currentUserId = auth.user?.id;

  const otherMembers = members.filter((member) => member.user_id !== currentUserId);
  if (!otherMembers.length) {
    return [];
  }

  const results = await Promise.all(
    otherMembers.map(async (member) => {
      const profile = member.profiles as {
        id: string;
        full_name: string | null;
        email: string;
        avatar_url: string | null;
        is_location_enabled: boolean;
        battery_level: number | null;
        is_charging: boolean;
        last_seen: string | null;
      };

      const { data: locations } = await supabase
        .from('locations')
        .select('*')
        .eq('user_id', member.user_id)
        .order('recorded_at', { ascending: false })
        .limit(1);

      const latestLocation = locations?.[0];

      return mapRowToCircleMember(
        {
          user_id: profile.id,
          full_name: profile.full_name,
          email: profile.email,
          avatar_url: profile.avatar_url,
          is_location_enabled: profile.is_location_enabled ?? true,
          battery_level: profile.battery_level,
          is_charging: profile.is_charging ?? false,
          last_seen: profile.last_seen,
          latitude: latestLocation ? Number(latestLocation.latitude) : null,
          longitude: latestLocation ? Number(latestLocation.longitude) : null,
          accuracy: latestLocation?.accuracy ?? null,
          recorded_at: latestLocation?.recorded_at ?? null,
          location_id: latestLocation?.id ?? null,
        },
        viewerSharing
      );
    })
  );

  return results;
}

/** @deprecated Use fetchCircleMembers instead */
export async function fetchCircleMemberMarkers(
  circleId: string,
  _currentUserId: string,
  viewerSharing = true
): Promise<FriendMarker[]> {
  const members = await fetchCircleMembers(circleId, viewerSharing);
  return circleMembersToMapMarkers(members);
}

export async function fetchMemberLocationUpdate(
  userId: string,
  viewerSharing: boolean
): Promise<CircleMemberLocation | null> {
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

  return mapRowToCircleMember(
    {
      user_id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      avatar_url: profile.avatar_url,
      is_location_enabled: profile.is_location_enabled ?? true,
      battery_level: profile.battery_level,
      is_charging: profile.is_charging ?? false,
      last_seen: profile.last_seen,
      latitude: latestLocation ? Number(latestLocation.latitude) : null,
      longitude: latestLocation ? Number(latestLocation.longitude) : null,
      accuracy: latestLocation?.accuracy ?? null,
      recorded_at: latestLocation?.recorded_at ?? null,
      location_id: latestLocation?.id ?? null,
    },
    viewerSharing
  );
}

/** @deprecated Use fetchMemberLocationUpdate instead */
export async function fetchMemberMarkerForUser(
  userId: string,
  viewerSharing = true
): Promise<FriendMarker | null> {
  const member = await fetchMemberLocationUpdate(userId, viewerSharing);
  if (!member) {
    return null;
  }

  return circleMemberToMapMarker(member);
}
