import { useEffect } from 'react';

export const ExpoKeepAwakeTag = 'ExpoKeepAwakeDefaultTag';

/**
 * Dev-safe replacement for expo-keep-awake's useKeepAwake.
 * Expo's withDevTools calls this on Android before the Activity is ready,
 * which causes noisy "Unable to activate keep awake" promise rejections.
 */
export function useKeepAwake(_tag?: string, _options?: { suppressDeactivateWarnings?: boolean }): void {
  useEffect(() => {
    return () => {};
  }, []);
}

export async function activateKeepAwakeAsync(): Promise<void> {}

export async function deactivateKeepAwake(): Promise<void> {}

export async function isAvailableAsync(): Promise<boolean> {
  return true;
}

export function activateKeepAwake(): Promise<void> {
  return activateKeepAwakeAsync();
}

export function addListener(): { remove: () => void } {
  return { remove: () => {} };
}
