/** Require biometric unlock after this much time away or idle (only when user opts in). */
export const BIOMETRIC_LOCK_AFTER_MS = 10 * 60 * 1000;

export function formatBiometricLockDuration(): string {
  return '10 minutes';
}
