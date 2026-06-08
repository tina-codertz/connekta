import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';
import type { Alert } from '@/types/database';

type NotificationsModule = typeof import('expo-notifications');

let notificationsModulePromise: Promise<NotificationsModule | null> | null = null;

function canUseNativeNotifications(): boolean {
  if (Platform.OS === 'web') {
    return false;
  }

  // Remote push is not available in Expo Go (SDK 53+).
  if (Constants.appOwnership === 'expo') {
    return false;
  }

  return true;
}

async function getNotificationsModule(): Promise<NotificationsModule | null> {
  if (!canUseNativeNotifications()) {
    return null;
  }

  if (!notificationsModulePromise) {
    notificationsModulePromise = import('expo-notifications')
      .then((Notifications) => {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
        return Notifications;
      })
      .catch((error) => {
        console.warn('expo-notifications unavailable:', error);
        return null;
      });
  }

  return notificationsModulePromise;
}

export async function registerForPushNotifications(
  userId: string
): Promise<string | null> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return null;
  }

  const Device = await import('expo-device');
  if (!Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('circle-alerts', {
      name: 'Circle alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  const tokenResponse = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined
  );

  const token = tokenResponse.data;

  await supabase
    .from('profiles')
    .update({ expo_push_token: token })
    .eq('id', userId);

  return token;
}

export async function showCircleAlertNotification(options: {
  title: string;
  body: string;
  alertType?: Alert['type'];
}): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: options.title,
      body: options.body,
      sound: options.alertType === 'sos' ? 'default' : undefined,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      data: { type: options.alertType ?? 'alert' },
      ...(Platform.OS === 'android' ? { channelId: 'circle-alerts' } : {}),
    },
    trigger: null,
  });
}

export function getAlertNotificationContent(
  alert: Pick<Alert, 'type' | 'message'>,
  senderName: string
): { title: string; body: string } {
  switch (alert.type) {
    case 'sos':
      return {
        title: `SOS from ${senderName}`,
        body: alert.message || `${senderName} sent an emergency alert.`,
      };
    case 'arrival':
      return {
        title: `${senderName} arrived`,
        body: alert.message || `${senderName} arrived at a saved place.`,
      };
    case 'departure':
      return {
        title: `${senderName} left a place`,
        body: alert.message || `${senderName} left a saved place.`,
      };
    case 'low_battery':
      return {
        title: `${senderName} low battery`,
        body: alert.message || `${senderName}'s battery is low.`,
      };
    default:
      return {
        title: 'Circle update',
        body: alert.message || `${senderName} sent an update.`,
      };
  }
}
