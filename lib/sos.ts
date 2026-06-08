import { supabase } from '@/lib/supabase';
import type { Circle } from '@/types/database';

export interface SosCircleSummary {
  id: string;
  name: string;
  memberCount: number;
}

export interface SendSosResult {
  circles_notified: number;
  members_notified: number;
  message: string;
}

export async function loadSosCircleSummaries(userId: string): Promise<SosCircleSummary[]> {
  const { data: memberships } = await supabase
    .from('circle_members')
    .select('circle_id')
    .eq('user_id', userId);

  if (!memberships?.length) {
    return [];
  }

  const circleIds = memberships.map((row) => row.circle_id);
  const { data: circles } = await supabase.from('circles').select('*').in('id', circleIds);

  if (!circles?.length) {
    return [];
  }

  const summaries = await Promise.all(
    circles.map(async (circle: Circle) => {
      const { count } = await supabase
        .from('circle_members')
        .select('*', { count: 'exact', head: true })
        .eq('circle_id', circle.id)
        .neq('user_id', userId);

      return {
        id: circle.id,
        name: circle.name,
        memberCount: count ?? 0,
      };
    })
  );

  return summaries;
}

export async function sendSosAlert(options: {
  latitude?: number | null;
  longitude?: number | null;
}): Promise<{ data: SendSosResult | null; error: Error | null }> {
  const { data, error } = await supabase.rpc('send_sos_alert', {
    p_latitude: options.latitude ?? null,
    p_longitude: options.longitude ?? null,
  });

  if (error) {
    const message = error.message.includes('Join a circle')
      ? 'Join a circle before sending SOS.'
      : error.message;
    return { data: null, error: new Error(message) };
  }

  return { data: data as SendSosResult, error: null };
}
