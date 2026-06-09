import { supabase } from '@/lib/supabase';
import { fetchMemberLocationUpdate } from '@/lib/circle-locations';
import type { CircleMemberLocation } from '@/components/map/types';

export async function fetchMissedMemberUpdates(
  memberIds: string[],
  sinceIso: string,
  viewerSharing: boolean
): Promise<CircleMemberLocation[]> {
  if (memberIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('locations')
    .select('user_id, recorded_at')
    .in('user_id', memberIds)
    .gt('recorded_at', sinceIso)
    .order('recorded_at', { ascending: false });

  if (error) {
    console.warn('Missed location recovery failed:', error.message);
    return [];
  }

  const latestByUser = new Map<string, string>();
  for (const row of data ?? []) {
    if (!latestByUser.has(row.user_id)) {
      latestByUser.set(row.user_id, row.recorded_at);
    }
  }

  const updates = await Promise.all(
    [...latestByUser.keys()].map((userId) =>
      fetchMemberLocationUpdate(userId, viewerSharing)
    )
  );

  return updates.filter((member): member is CircleMemberLocation => member !== null);
}
