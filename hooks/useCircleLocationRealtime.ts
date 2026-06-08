import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  fetchCircleMemberMarkers,
  fetchMemberMarkerForUser,
} from '@/lib/circle-locations';
import type { FriendMarker } from '@/components/map/types';
import type { Location } from '@/types/database';

const POLL_INTERVAL_MS = 20_000;

type UseCircleLocationRealtimeOptions = {
  circleId: string | undefined;
  currentUserId: string | undefined;
  enabled: boolean;
  onMarkersLoaded: (markers: FriendMarker[]) => void;
  onMemberUpdated: (marker: FriendMarker) => void;
};

export function useCircleLocationRealtime({
  circleId,
  currentUserId,
  enabled,
  onMarkersLoaded,
  onMemberUpdated,
}: UseCircleLocationRealtimeOptions) {
  const memberIdsRef = useRef<Set<string>>(new Set());
  const callbacksRef = useRef({ onMarkersLoaded, onMemberUpdated });

  callbacksRef.current = { onMarkersLoaded, onMemberUpdated };

  useEffect(() => {
    if (!circleId || !currentUserId || !enabled) {
      memberIdsRef.current = new Set();
      return;
    }

    let cancelled = false;

    async function loadMembers() {
      const { data: members } = await supabase
        .from('circle_members')
        .select('user_id')
        .eq('circle_id', circleId);

      if (cancelled) {
        return;
      }

      const ids = new Set(
        (members ?? [])
          .map((member) => member.user_id)
          .filter((userId) => userId !== currentUserId)
      );
      memberIdsRef.current = ids;

      const markers = await fetchCircleMemberMarkers(circleId, currentUserId);
      if (!cancelled) {
        callbacksRef.current.onMarkersLoaded(markers);
      }
    }

    loadMembers();

    const channel = supabase
      .channel(`circle-locations-${circleId}-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'locations',
        },
        async (payload) => {
          const row = payload.new as Location;
          if (!memberIdsRef.current.has(row.user_id)) {
            return;
          }

          const marker = await fetchMemberMarkerForUser(row.user_id);
          if (marker) {
            callbacksRef.current.onMemberUpdated(marker);
          }
        }
      )
      .subscribe();

    const pollId = setInterval(() => {
      loadMembers();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(pollId);
      supabase.removeChannel(channel);
    };
  }, [circleId, currentUserId, enabled]);
}
