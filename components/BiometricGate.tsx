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
import { BIOMETRIC_LOCK_AFTER_MS } from '@/lib/biometric-lock';
import { isBiometricUnlockEnabled } from '@/lib/device-auth';
import {
  authenticateWithBiometrics,
  hasBiometricHardware,
  isBiometricEnrolled,
  isLocalAuthenticationAvailable,
} from '@/lib/local-authentication';
import { Colors } from '@/lib/theme';

const INACTIVITY_CHECK_MS = 30_000;

type BiometricGateProps = {
  children: React.ReactNode;
  hasSession: boolean;
};

export function BiometricGate({ children, hasSession }: BiometricGateProps) {
  const [locked, setLocked] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [supported, setSupported] = useState(false);
  const backgroundAtRef = useRef<number | null>(null);
  const lastActivityRef = useRef(Date.now());
  const lockingRef = useRef(false);

  const refreshBiometricEnabled = useCallback(async () => {
    const enabled = await isBiometricUnlockEnabled();
    setBiometricEnabled(enabled);
    if (!enabled) {
      setLocked(false);
      lockingRef.current = false;
    }
    return enabled;
  }, []);

  const recordActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    backgroundAtRef.current = null;
  }, []);

  const unlock = useCallback(async () => {
    if (Platform.OS === 'web' || !hasSession) {
      setLocked(false);
      lockingRef.current = false;
      return;
    }

    const enabled = await isBiometricUnlockEnabled();
    if (!enabled) {
      setLocked(false);
      lockingRef.current = false;
      return;
    }

    const result = await authenticateWithBiometrics({
      promptMessage: 'Unlock LocateMate',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    if (result.success) {
      setLocked(false);
      lockingRef.current = false;
      recordActivity();
    }
  }, [hasSession, recordActivity]);

  const lockIfInactive = useCallback(async () => {
    if (lockingRef.current || locked || Platform.OS === 'web' || !hasSession) {
      return;
    }

    const enabled = await isBiometricUnlockEnabled();
    if (!enabled || !supported) {
      return;
    }

    const idleMs = Date.now() - lastActivityRef.current;
    const backgroundAt = backgroundAtRef.current;
    const awayMs = backgroundAt ? Date.now() - backgroundAt : 0;
    const shouldLock =
      idleMs >= BIOMETRIC_LOCK_AFTER_MS || awayMs >= BIOMETRIC_LOCK_AFTER_MS;

    if (!shouldLock) {
      if (backgroundAt != null && awayMs < BIOMETRIC_LOCK_AFTER_MS) {
        backgroundAtRef.current = null;
      }
      return;
    }

    lockingRef.current = true;
    setLocked(true);
    await unlock();
  }, [hasSession, locked, supported, unlock]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    void refreshBiometricEnabled();

    if (!isLocalAuthenticationAvailable()) {
      setSupported(false);
      return;
    }

    Promise.all([hasBiometricHardware(), isBiometricEnrolled()])
      .then(([hasHardware, enrolled]) => {
        setSupported(hasHardware && enrolled);
      })
      .catch(() => setSupported(false));
  }, [refreshBiometricEnabled]);

  useEffect(() => {
    if (!hasSession || Platform.OS === 'web' || !biometricEnabled || !supported) {
      setLocked(false);
      lockingRef.current = false;
      return;
    }

    let active = true;
    recordActivity();

    const onAppStateChange = (nextState: AppStateStatus) => {
      if (!active) {
        return;
      }

      if (nextState === 'background' || nextState === 'inactive') {
        if (backgroundAtRef.current == null) {
          backgroundAtRef.current = Date.now();
        }
        return;
      }

      if (nextState !== 'active') {
        return;
      }

      void refreshBiometricEnabled().then((enabled) => {
        if (!active || !enabled) {
          backgroundAtRef.current = null;
          return;
        }
        void lockIfInactive();
      });
    };

    const inactivityTimer = setInterval(() => {
      if (AppState.currentState === 'active') {
        void lockIfInactive();
      }
    }, INACTIVITY_CHECK_MS);

    const appStateSubscription = AppState.addEventListener('change', onAppStateChange);
    return () => {
      active = false;
      appStateSubscription.remove();
      clearInterval(inactivityTimer);
    };
  }, [
    biometricEnabled,
    hasSession,
    lockIfInactive,
    recordActivity,
    refreshBiometricEnabled,
    supported,
  ]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void refreshBiometricEnabled();
      }
    });

    return () => subscription.remove();
  }, [refreshBiometricEnabled]);

  if (!hasSession || !biometricEnabled) {
    return <>{children}</>;
  }

  if (!locked) {
    return (
      <View
        style={styles.container}
        onStartShouldSetResponder={() => {
          recordActivity();
          return false;
        }}
        onMoveShouldSetResponder={() => {
          recordActivity();
          return false;
        }}
        onResponderTerminationRequest={() => false}
      >
        {children}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {children}
      <View style={styles.overlay}>
        <Text textStyle={styles.title}>LocateMate is locked</Text>
        <Text textStyle={styles.subtitle}>Use Face ID or Touch ID to continue</Text>
        <TouchableOpacity style={styles.button} onPress={unlock}>
          <Text textStyle={styles.buttonText}>Unlock</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
