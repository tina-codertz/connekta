import { Alert, Platform, Share } from 'react-native';
import * as Linking from 'expo-linking';

export function buildFriendInviteLink(inviterUserId: string): string {
  const webBase = process.env.EXPO_PUBLIC_APP_INVITE_URL?.trim();

  if (webBase) {
    const separator = webBase.includes('?') ? '&' : '?';
    return `${webBase}${separator}from=${encodeURIComponent(inviterUserId)}`;
  }

  return Linking.createURL('invite', {
    queryParams: { from: inviterUserId },
  });
}

export function buildFriendInviteMessage(inviterName: string, inviteLink: string): string {
  return (
    `${inviterName} invited you to LocateMate — share your location with friends and family.\n\n` +
    `Tap this link once to join: ${inviteLink}`
  );
}

function buildPersonalizedInviteMessage(options: {
  inviterUserId: string;
  inviterName: string;
  recipientName?: string;
}): string {
  const link = buildFriendInviteLink(options.inviterUserId);
  const greeting = options.recipientName ? `Hey ${options.recipientName}! ` : '';
  return `${greeting}${buildFriendInviteMessage(options.inviterName, link)}`;
}

export function normalizePhoneForMessaging(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

export function phoneDigitsOnly(phone: string): string {
  return normalizePhoneForMessaging(phone).replace(/\D/g, '');
}

async function openMessagingUrl(url: string, fallbackMessage: string): Promise<void> {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return;
    }
  } catch {
    // Fall through to alert below.
  }

  Alert.alert('Unable to open', fallbackMessage);
}

export async function sendFriendInviteViaWhatsApp(options: {
  phone: string;
  inviterUserId: string;
  inviterName: string;
  recipientName?: string;
}): Promise<void> {
  const phone = phoneDigitsOnly(options.phone);
  if (!phone) {
    Alert.alert('Invalid number', 'This contact does not have a valid phone number.');
    return;
  }

  const message = buildPersonalizedInviteMessage(options);
  const appUrl = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
  const webUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  try {
    const canOpenApp = await Linking.canOpenURL('whatsapp://send');
    await Linking.openURL(canOpenApp ? appUrl : webUrl);
  } catch {
    await openMessagingUrl(webUrl, 'Install WhatsApp or check the phone number and try again.');
  }
}

export async function sendFriendInviteViaSms(options: {
  phone: string;
  inviterUserId: string;
  inviterName: string;
  recipientName?: string;
}): Promise<void> {
  const phone = normalizePhoneForMessaging(options.phone);
  if (!phone) {
    Alert.alert('Invalid number', 'This contact does not have a valid phone number.');
    return;
  }

  const message = buildPersonalizedInviteMessage(options);
  const encodedMessage = encodeURIComponent(message);
  const url =
    Platform.OS === 'ios'
      ? `sms:${phone}&body=${encodedMessage}`
      : `sms:${phone}?body=${encodedMessage}`;

  await openMessagingUrl(url, 'Messages could not be opened for this phone number.');
}

export function pickContactPhone(
  contactName: string,
  phones: string[],
  onPick: (phone: string) => void
): void {
  if (!phones.length) {
    Alert.alert('No phone number', `${contactName} does not have a phone number to message.`);
    return;
  }

  if (phones.length === 1) {
    onPick(phones[0]);
    return;
  }

  Alert.alert(
    `Choose number for ${contactName}`,
    undefined,
    [
      ...phones.map((phone) => ({
        text: phone,
        onPress: () => onPick(phone),
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]
  );
}

export async function shareFriendInviteLink(options: {
  inviterUserId: string;
  inviterName: string;
  recipientName?: string;
}): Promise<void> {
  const message = buildPersonalizedInviteMessage(options);

  await Share.share({
    message,
    title: 'Join me on LocateMate',
  });
}
