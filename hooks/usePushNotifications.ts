import { useEffect } from 'react';
import { registerForPushNotifications } from '@/lib/push-notifications';

export function usePushNotifications(
  userId: string | undefined,
  enabled = true
) {
  useEffect(() => {
    if (!userId || !enabled) {
      return;
    }

    registerForPushNotifications(userId).catch((error) => {
      console.warn('Push registration failed:', error);
    });
  }, [userId, enabled]);
}
