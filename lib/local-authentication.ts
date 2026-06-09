import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

const AUTH_TYPE_FINGERPRINT = 1;
const AUTH_TYPE_FACIAL = 2;

export type LocalAuthenticationError =
  | 'not_enrolled'
  | 'user_cancel'
  | 'app_cancel'
  | 'not_available'
  | 'lockout'
  | 'no_space'
  | 'timeout'
  | 'unable_to_process'
  | 'unknown'
  | 'system_cancel'
  | 'user_fallback'
  | 'invalid_context'
  | 'passcode_not_set'
  | 'authentication_failed';

export type LocalAuthenticationResult =
  | { success: true }
  | { success: false; error: LocalAuthenticationError; warning?: string };

type LocalAuthenticationModule = {
  hasHardwareAsync(): Promise<boolean>;
  isEnrolledAsync(): Promise<boolean>;
  supportedAuthenticationTypesAsync(): Promise<number[]>;
  authenticateAsync(options: {
    promptMessage?: string;
    promptSubtitle?: string;
    cancelLabel?: string;
    disableDeviceFallback?: boolean;
  }): Promise<LocalAuthenticationResult>;
};

export type BiometricSupport = {
  moduleAvailable: boolean;
  hasHardware: boolean;
  isEnrolled: boolean;
  label: string;
  canEnable: boolean;
};

function getLocalAuthentication(): LocalAuthenticationModule | null {
  return requireOptionalNativeModule<LocalAuthenticationModule>('ExpoLocalAuthentication');
}

function labelFromAuthTypes(types: number[]): string {
  if (types.includes(AUTH_TYPE_FACIAL)) {
    return Platform.OS === 'ios' ? 'Face ID' : 'Face unlock';
  }
  if (types.includes(AUTH_TYPE_FINGERPRINT)) {
    return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
  }
  return Platform.OS === 'ios' ? 'Face ID or Touch ID' : 'Biometrics';
}

export function isLocalAuthenticationAvailable(): boolean {
  return getLocalAuthentication() != null;
}

export async function getBiometricSupport(): Promise<BiometricSupport> {
  const localAuth = getLocalAuthentication();
  if (!localAuth) {
    return {
      moduleAvailable: false,
      hasHardware: false,
      isEnrolled: false,
      label: 'Biometrics',
      canEnable: false,
    };
  }

  const [hasHardware, isEnrolled, authTypes] = await Promise.all([
    localAuth.hasHardwareAsync?.() ?? Promise.resolve(false),
    localAuth.isEnrolledAsync?.() ?? Promise.resolve(false),
    localAuth.supportedAuthenticationTypesAsync?.() ?? Promise.resolve([]),
  ]);

  const label = labelFromAuthTypes(authTypes);

  return {
    moduleAvailable: true,
    hasHardware,
    isEnrolled,
    label,
    canEnable: hasHardware && isEnrolled,
  };
}

export async function hasBiometricHardware(): Promise<boolean> {
  const support = await getBiometricSupport();
  return support.hasHardware;
}

export async function isBiometricEnrolled(): Promise<boolean> {
  const support = await getBiometricSupport();
  return support.isEnrolled;
}

export async function authenticateWithBiometrics(options: {
  promptMessage: string;
  promptSubtitle?: string;
  cancelLabel: string;
  disableDeviceFallback: boolean;
}): Promise<LocalAuthenticationResult> {
  const localAuth = getLocalAuthentication();
  if (!localAuth?.authenticateAsync) {
    return { success: false, error: 'not_available' };
  }
  return localAuth.authenticateAsync(options);
}

function mapAuthenticationError(error: LocalAuthenticationError, label: string): string {
  switch (error) {
    case 'not_enrolled':
      return `Set up ${label} in your device Settings first.`;
    case 'user_cancel':
    case 'system_cancel':
    case 'app_cancel':
      return 'Biometric setup was cancelled.';
    case 'passcode_not_set':
      return 'Set a device passcode before enabling biometrics.';
    case 'lockout':
      return `${label} is temporarily locked. Try again later.`;
    case 'authentication_failed':
      return `${label} verification failed. Try again.`;
    case 'not_available':
      return `${label} is not available on this device.`;
    default:
      return `Could not verify ${label}. Try again.`;
  }
}

/** Verify the user's biometric before enabling app lock. */
export async function registerBiometricForAppUnlock(): Promise<{
  success: boolean;
  error?: string;
}> {
  const support = await getBiometricSupport();

  if (!support.moduleAvailable || !support.hasHardware) {
    return {
      success: false,
      error: 'Biometric authentication is not available on this device.',
    };
  }

  if (!support.isEnrolled) {
    return {
      success: false,
      error: `Set up ${support.label} in your device Settings first, then try again.`,
    };
  }

  const result = await authenticateWithBiometrics({
    promptMessage: `Enable ${support.label} for LocateMate`,
    promptSubtitle: 'Verify your identity to turn on app lock',
    cancelLabel: 'Cancel',
    disableDeviceFallback: true,
  });

  if (result.success) {
    return { success: true };
  }

  return {
    success: false,
    error: mapAuthenticationError(result.error, support.label),
  };
}

export async function unlockWithBiometrics(label: string): Promise<LocalAuthenticationResult> {
  return authenticateWithBiometrics({
    promptMessage: 'Unlock LocateMate',
    promptSubtitle: `Use ${label} to continue`,
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
  });
}
