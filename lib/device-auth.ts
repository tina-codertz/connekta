import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

const DEVICE_AUTH_DOMAIN = 'device.locatemate.local';
const SECURE_USERNAME_KEY = 'locatemate-username';
const BIOMETRIC_ENABLED_KEY = 'locatemate-biometric-enabled';

export type NormalizedUsername = string;

type ExpoCryptoModule = {
  digestStringAsync(
    algorithm: string,
    data: string,
    options?: { encoding: string }
  ): Promise<string>;
  getRandomValues(array: Uint8Array): void;
};

type ExpoSecureStoreModule = {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
};

type ExpoApplicationModule = {
  getAndroidId(): string | null;
  getIosIdForVendorAsync(): Promise<string | null>;
};

function getExpoCrypto(): ExpoCryptoModule | null {
  return requireOptionalNativeModule<ExpoCryptoModule>('ExpoCrypto');
}

function getExpoSecureStore(): ExpoSecureStoreModule | null {
  return requireOptionalNativeModule<ExpoSecureStoreModule>('ExpoSecureStore');
}

function getExpoApplication(): ExpoApplicationModule | null {
  return requireOptionalNativeModule<ExpoApplicationModule>('ExpoApplication');
}

function missingNativeModuleMessage(moduleName: string): string {
  return `${moduleName} is not available. Rebuild the dev client with: npx expo run:ios`;
}

async function digestSha256Hex(input: string): Promise<string> {
  const crypto = getExpoCrypto();
  if (crypto?.digestStringAsync) {
    return crypto.digestStringAsync('SHA-256', input, { encoding: 'HEX' });
  }

  if (globalThis.crypto?.subtle) {
    const data = new TextEncoder().encode(input);
    const hash = await globalThis.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  throw new Error(missingNativeModuleMessage('expo-crypto'));
}

async function createRandomId(): Promise<string> {
  const crypto = getExpoCrypto();
  if (crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
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
  return getExpoCrypto() != null && getExpoSecureStore() != null;
}
