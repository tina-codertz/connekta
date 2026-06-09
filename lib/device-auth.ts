import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';
import { sha256Hex } from '@/lib/sha256';

const DEVICE_AUTH_DOMAIN = 'device.locatemate.local';
const SECURE_USERNAME_KEY = 'locatemate-username';
const BIOMETRIC_ENABLED_KEY = 'locatemate-biometric-enabled';

export type NormalizedUsername = string;

type ExpoSecureStoreModule = {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
};

type ExpoApplicationModule = {
  getAndroidId(): string | null;
  getIosIdForVendorAsync(): Promise<string | null>;
};

function getExpoSecureStore(): ExpoSecureStoreModule | null {
  return requireOptionalNativeModule<ExpoSecureStoreModule>('ExpoSecureStore');
}

function getExpoApplication(): ExpoApplicationModule | null {
  return requireOptionalNativeModule<ExpoApplicationModule>('ExpoApplication');
}

async function digestSha256Hex(input: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (subtle) {
    const data = new TextEncoder().encode(input);
    const hash = await subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  return sha256Hex(input);
}

async function createRandomId(): Promise<string> {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  if (globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  return `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function secureGet(key: string): Promise<string | null> {
  const secureStore = getExpoSecureStore();
  if (secureStore?.getItemAsync) {
    return secureStore.getItemAsync(key);
  }
  return AsyncStorage.getItem(`secure:${key}`);
}

async function secureSet(key: string, value: string): Promise<void> {
  const secureStore = getExpoSecureStore();
  if (secureStore?.setItemAsync) {
    await secureStore.setItemAsync(key, value);
    return;
  }
  await AsyncStorage.setItem(`secure:${key}`, value);
}

async function secureDelete(key: string): Promise<void> {
  const secureStore = getExpoSecureStore();
  if (secureStore?.deleteItemAsync) {
    await secureStore.deleteItemAsync(key);
    return;
  }
  await AsyncStorage.removeItem(`secure:${key}`);
}

export function normalizeUsername(raw: string): NormalizedUsername | null {
  const username = raw.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (username.length < 3 || username.length > 20) {
    return null;
  }
  return username;
}

export function usernameToAuthEmail(username: NormalizedUsername): string {
  return `${username}@${DEVICE_AUTH_DOMAIN}`;
}

export async function getDeviceId(): Promise<string> {
  const application = getExpoApplication();

  if (Platform.OS === 'android') {
    return application?.getAndroidId?.() ?? 'android-device';
  }

  if (Platform.OS === 'ios') {
    return (await application?.getIosIdForVendorAsync?.()) ?? 'ios-device';
  }

  const stored = await secureGet('locatemate-web-device-id');
  if (stored) {
    return stored;
  }

  const generated = `web-${await createRandomId()}`;
  await secureSet('locatemate-web-device-id', generated);
  return generated;
}

export async function deriveDevicePassword(
  deviceId: string,
  username: NormalizedUsername
): Promise<string> {
  const digest = await digestSha256Hex(`${deviceId}:${username}:locatemate-device-v1`);
  return `${digest.slice(0, 28)}Aa1!`;
}

export async function saveLinkedUsername(username: NormalizedUsername) {
  await secureSet(SECURE_USERNAME_KEY, username);
}

export async function getLinkedUsername(): Promise<string | null> {
  return secureGet(SECURE_USERNAME_KEY);
}

export async function clearLinkedUsername() {
  await secureDelete(SECURE_USERNAME_KEY);
}

export async function setBiometricUnlockEnabled(enabled: boolean) {
  if (enabled) {
    await secureSet(BIOMETRIC_ENABLED_KEY, '1');
  } else {
    await secureDelete(BIOMETRIC_ENABLED_KEY);
  }
}

export async function isBiometricUnlockEnabled(): Promise<boolean> {
  const value = await secureGet(BIOMETRIC_ENABLED_KEY);
  return value === '1';
}

export function isDeviceAuthNativeReady(): boolean {
  return getExpoSecureStore() != null;
}
