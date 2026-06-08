import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchCircleMembers, fetchMemberLocationUpdate } from '@/lib/circle-locations';
import type { CircleMemberLocation } from '@/components/map/types';
import type { Location } from '@/types/database';

const POLL_INTERVAL_MS = 15_000;

type UseCircleLocationRealtimeOptions = {
  circleId: string | undefined;
  currentUserId: string | undefined;
  viewerSharing: boolean;
  enabled: boolean;
  onMembersLoaded: (members: CircleMemberLocation[]) => void;
  onMemberUpdated: (member: CircleMemberLocation) => void;
};

export function useCircleLocationRealtime({
  circleId,
  currentUserId,
  viewerSharing,
  enabled,
  onMembersLoaded,
  onMemberUpdated,
}: UseCircleLocationRealtimeOptions) {
  const memberIdsRef = useRef<Set<string>>(new Set());
  const callbacksRef = useRef({ onMembersLoaded, onMemberUpdated });
  const viewerSharingRef = useRef(viewerSharing);

  callbacksRef.current = { onMembersLoaded, onMemberUpdated };
  viewerSharingRef.current = viewerSharing;

  useEffect(() => {
    if (!circleId || !currentUserId || !enabled) {
      memberIdsRef.current = new Set();
      return;
    }

    const activeCircleId = circleId;
    const activeUserId = currentUserId;
    let cancelled = false;

    async function loadMembers() {
      const { data: members } = await supabase
        .from('circle_members')
        .select('user_id')
        .eq('circle_id', activeCircleId);

      if (cancelled) {
        return;
      }

      const ids = new Set(
        (members ?? [])
          .map((member) => member.user_id)
          .filter((userId) => userId !== activeUserId)
      );
      memberIdsRef.current = ids;

      const circleMembers = await fetchCircleMembers(
        activeCircleId,
        viewerSharingRef.current
      );

      if (!cancelled) {
        callbacksRef.current.onMembersLoaded(circleMembers);
      }
    }

    loadMembers();

    const channel = supabase
      .channel(`circle-locations-${activeCircleId}-${activeUserId}`)
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

          const member = await fetchMemberLocationUpdate(
            row.user_id,
            viewerSharingRef.current
          );

          if (member) {
            callbacksRef.current.onMemberUpdated(member);
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
  }, [circleId, currentUserId, enabled, viewerSharing]);
}
