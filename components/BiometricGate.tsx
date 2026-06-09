import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  type AppStateStatus,
} from 'react-native';
import { Text } from '@/components/ExpoUI';
import { isBiometricUnlockEnabled } from '@/lib/device-auth';
import {
  authenticateWithBiometrics,
  hasBiometricHardware,
  isBiometricEnrolled,
  isLocalAuthenticationAvailable,
} from '@/lib/local-authentication';
import { Colors } from '@/lib/theme';

const LOCK_GRACE_MS = 30_000;

type BiometricGateProps = {
  children: React.ReactNode;
  hasSession: boolean;
};

export function BiometricGate({ children, hasSession }: BiometricGateProps) {
  const [locked, setLocked] = useState(false);
  const [supported, setSupported] = useState(false);
  const backgroundAtRef = useRef<number | null>(null);

  const unlock = useCallback(async () => {
    if (Platform.OS === 'web' || !hasSession) {
      setLocked(false);
      return;
    }

    const enabled = await isBiometricUnlockEnabled();
    if (!enabled) {
      setLocked(false);
      return;
    }

    const result = await authenticateWithBiometrics({
      promptMessage: 'Unlock LocateMate',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    if (result.success) {
      setLocked(false);
      backgroundAtRef.current = null;
    }
  }, [hasSession]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    if (!isLocalAuthenticationAvailable()) {
      setSupported(false);
      return;
    }

    Promise.all([hasBiometricHardware(), isBiometricEnrolled()])
      .then(([hasHardware, enrolled]) => {
        setSupported(hasHardware && enrolled);
      })
      .catch(() => setSupported(false));
  }, []);

  useEffect(() => {
    if (!hasSession || Platform.OS === 'web') {
      setLocked(false);
      return;
    }

    let active = true;

    async function maybeLock() {
      const enabled = await isBiometricUnlockEnabled();
      if (!active || !enabled || !supported) {
        return;
      }
      setLocked(true);
      await unlock();
    }

    const onAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        backgroundAtRef.current = Date.now();
        return;
      }

      if (nextState !== 'active') {
        return;
      }

      const backgroundAt = backgroundAtRef.current;
      if (!backgroundAt) {
        return;
      }

      if (Date.now() - backgroundAt >= LOCK_GRACE_MS) {
        void maybeLock();
      } else {
        backgroundAtRef.current = null;
      }
    };

    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => {
      active = false;
      subscription.remove();
    };
  }, [hasSession, supported, unlock]);

  if (!locked) {
    return <>{children}</>;
  }

  return (
    <View style={styles.overlay}>
      <Text textStyle={styles.title}>LocateMate is locked</Text>
      <Text textStyle={styles.subtitle}>Use Face ID or Touch ID to continue</Text>
      <TouchableOpacity style={styles.button} onPress={unlock}>
        <Text textStyle={styles.buttonText}>Unlock</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 999,
    backgroundColor: Colors.neutral[950],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.neutral[0],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.neutral[400],
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: Colors.primary[600],
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  buttonText: {
    color: Colors.neutral[0],
    fontSize: 16,
    fontWeight: '600',
  },
});
