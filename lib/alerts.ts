import { supabase } from '@/lib/supabase';
import { getDisplayName } from '@/lib/profile';
import type { Alert, Circle, Profile } from '@/types/database';

export interface MapAlertItem {
  id: string;
  type: Alert['type'];
  message: string | null;
  created_at: string;
  is_read: boolean;
  senderName: string;
  circleName: string;
}

type AlertRow = Alert & {
  profiles: Profile | null;
  circles: Pick<Circle, 'name'> | null;
};

export async function loadMapAlerts(userId: string): Promise<MapAlertItem[]> {
  const { data: memberships } = await supabase
    .from('circle_members')
    .select('circle_id')
    .eq('user_id', userId);

  if (!memberships?.length) {
    return [];
  }

  const circleIds = memberships.map((row) => row.circle_id);

  const { data, error } = await supabase
    .from('alerts')
    .select('*, profiles(*), circles(name)')
    .in('circle_id', circleIds)
    .neq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data) {
    return [];
  }

  return (data as AlertRow[]).map((alert) => ({
    id: alert.id,
    type: alert.type,
    message: alert.message,
    created_at: alert.created_at,
    is_read: alert.is_read,
    senderName: getDisplayName(alert.profiles),
    circleName: alert.circles?.name ?? 'Circle',
  }));
}

export async function getUnreadAlertCount(userId: string): Promise<number> {
  const { data: memberships } = await supabase
    .from('circle_members')
    .select('circle_id')
    .eq('user_id', userId);

  if (!memberships?.length) {
    return 0;
  }

  const circleIds = memberships.map((row) => row.circle_id);

  const { count, error } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .in('circle_id', circleIds)
    .neq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export async function markAlertAsRead(alertId: string): Promise<void> {
  await supabase.rpc('mark_alert_read', { p_alert_id: alertId });
}

export async function markAllAlertsAsRead(): Promise<void> {
  await supabase.rpc('mark_all_alerts_read');
}

export function formatAlertTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export function getAlertTypeLabel(type: Alert['type']): string {
  switch (type) {
    case 'sos':
      return 'SOS';
    case 'arrival':
      return 'Arrived';
    case 'departure':
      return 'Left';
    case 'low_battery':
      return 'Low battery';
    default:
      return 'Alert';
  }
}
