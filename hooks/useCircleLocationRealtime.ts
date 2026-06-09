import { useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { fetchCircleMembers, fetchMemberLocationUpdate } from '@/lib/circle-locations';
import { fetchMissedMemberUpdates } from '@/lib/realtime-recovery';
import type { CircleMemberLocation } from '@/components/map/types';
import type { Location } from '@/types/database';

const POLL_INTERVAL_MS = 30_000;
const RECONNECT_BASE_MS = 2_000;
const RECONNECT_MAX_MS = 30_000;

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
  const lastSyncAtRef = useRef(new Date().toISOString());
  const reconnectAttemptRef = useRef(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        lastSyncAtRef.current = new Date().toISOString();
      }
    }

    async function recoverMissedUpdates() {
      const since = lastSyncAtRef.current;
      const memberIds = [...memberIdsRef.current];
      const missed = await fetchMissedMemberUpdates(
        memberIds,
        since,
        viewerSharingRef.current
      );

      if (cancelled || missed.length === 0) {
        return;
      }

      for (const member of missed) {
        callbacksRef.current.onMemberUpdated(member);
      }

      lastSyncAtRef.current = new Date().toISOString();
    }

    function clearReconnectTimer() {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    }

    function scheduleReconnect() {
      if (cancelled) {
        return;
      }

      clearReconnectTimer();
      const attempt = reconnectAttemptRef.current;
      const delay = Math.min(RECONNECT_BASE_MS * 2 ** attempt, RECONNECT_MAX_MS);
      reconnectAttemptRef.current = attempt + 1;

      reconnectTimerRef.current = setTimeout(() => {
        subscribe();
      }, delay);
    }

    function teardownChannel() {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    }

    function subscribe() {
      teardownChannel();

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
              lastSyncAtRef.current = new Date().toISOString();
            }
          }
        )
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            reconnectAttemptRef.current = 0;
            await recoverMissedUpdates();
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            scheduleReconnect();
          }
        });

      channelRef.current = channel;
    }

    loadMembers();
    subscribe();

    const pollId = setInterval(() => {
      loadMembers();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(pollId);
      clearReconnectTimer();
      teardownChannel();
    };
  }, [circleId, currentUserId, enabled, viewerSharing]);
}
