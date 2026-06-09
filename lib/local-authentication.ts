import { requireOptionalNativeModule } from 'expo-modules-core';

type LocalAuthenticationModule = {
  hasHardwareAsync(): Promise<boolean>;
  isEnrolledAsync(): Promise<boolean>;
  authenticateAsync(options: {
    promptMessage?: string;
    cancelLabel?: string;
    disableDeviceFallback?: boolean;
  }): Promise<{ success: boolean }>;
};

function getLocalAuthentication(): LocalAuthenticationModule | null {
  return requireOptionalNativeModule<LocalAuthenticationModule>('ExpoLocalAuthentication');
}

export function isLocalAuthenticationAvailable(): boolean {
  return getLocalAuthentication() != null;
}

export async function hasBiometricHardware(): Promise<boolean> {
  const localAuth = getLocalAuthentication();
  if (!localAuth?.hasHardwareAsync) {
    return false;
  }
  return localAuth.hasHardwareAsync();
}

export async function isBiometricEnrolled(): Promise<boolean> {
  const localAuth = getLocalAuthentication();
  if (!localAuth?.isEnrolledAsync) {
    return false;
  }
  return localAuth.isEnrolledAsync();
}

export async function authenticateWithBiometrics(options: {
  promptMessage: string;
  cancelLabel: string;
  disableDeviceFallback: boolean;
}): Promise<{ success: boolean }> {
  const localAuth = getLocalAuthentication();
  if (!localAuth?.authenticateAsync) {
    return { success: false };
  }
  return localAuth.authenticateAsync(options);
}
