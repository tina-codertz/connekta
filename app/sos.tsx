import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { AlertTriangle, ArrowLeft, Users } from 'lucide-react-native';
import { Column, Row, Text } from '@/components/ExpoUI';
import { LinearGradient } from '@/components/LinearGradient';
import { useAuth } from '@/hooks/useAuth';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { loadSosCircleSummaries, sendSosAlert, SosCircleSummary } from '@/lib/sos';
import { Colors } from '@/lib/theme';

const HOLD_DURATION_MS = 2000;

export default function SosScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const locationSharingEnabled = profile?.is_location_enabled ?? true;
  const { location } = useLocationTracking(user?.id, locationSharingEnabled);

  const [circles, setCircles] = useState<SosCircleSummary[]>([]);
  const [loadingCircles, setLoadingCircles] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [holding, setHolding] = useState(false);

  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdStartRef = useRef<number | null>(null);

  const totalMembers = circles.reduce((sum, circle) => sum + circle.memberCount, 0);

  const loadCircles = useCallback(async () => {
    if (!user?.id) {
      setCircles([]);
      setLoadingCircles(false);
      return;
    }

    setLoadingCircles(true);
    const summaries = await loadSosCircleSummaries(user.id);
    setCircles(summaries);
    setLoadingCircles(false);
  }, [user?.id]);

  useEffect(() => {
    loadCircles();
  }, [loadCircles]);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
      }
    };
  }, []);

  function clearHoldTimer() {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    holdStartRef.current = null;
    setHolding(false);
    setHoldProgress(0);
  }

  async function triggerSos() {
    if (sending || sent || !user?.id) return;

    if (!circles.length) {
      Alert.alert('No circles', 'Join or create a circle before sending SOS.');
      return;
    }

    setSending(true);
    clearHoldTimer();

    try {
      const { data, error } = await sendSosAlert({
        latitude: location?.coords.latitude ?? null,
        longitude: location?.coords.longitude ?? null,
      });

      if (error) {
        Alert.alert('SOS failed', error.message);
        return;
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSent(true);

      const memberText =
        data && data.members_notified === 1
          ? '1 circle member'
          : `${data?.members_notified ?? 0} circle members`;

      Alert.alert(
        'SOS sent',
        `Your alert was sent to ${memberText} across ${data?.circles_notified ?? circles.length} circle(s).`
      );
    } finally {
      setSending(false);
    }
  }

  function handlePressIn() {
    if (sending || sent || !circles.length) return;

    setHolding(true);
    holdStartRef.current = Date.now();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    holdTimerRef.current = setInterval(() => {
      const startedAt = holdStartRef.current;
      if (!startedAt) return;

      const progress = Math.min((Date.now() - startedAt) / HOLD_DURATION_MS, 1);
      setHoldProgress(progress);

      if (progress >= 1) {
        clearHoldTimer();
        triggerSos();
      }
    }, 50);
  }

  function handlePressOut() {
    if (holdProgress < 1) {
      clearHoldTimer();
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.neutral[0]} />
        </TouchableOpacity>
        <Text textStyle={styles.headerTitle}>Emergency SOS</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Column spacing={24} style={styles.content}>
        <View style={styles.warningCard}>
          <AlertTriangle size={28} color="#FCA5A5" />
          <Column spacing={8} style={styles.warningText}>
            <Text textStyle={styles.warningTitle}>Circle members only</Text>
            <Text textStyle={styles.warningBody}>
              Pressing SOS notifies people in your circles — not friends outside your circles.
              Your current location is included when available.
            </Text>
          </Column>
        </View>

        <Column spacing={12}>
          <Text textStyle={styles.sectionTitle}>Who will be notified</Text>

          {loadingCircles ? (
            <ActivityIndicator color={Colors.primary[500]} style={styles.loader} />
          ) : circles.length ? (
            <Column spacing={8}>
              {circles.map((circle) => (
                <View key={circle.id} style={styles.circleRow}>
                  <Row spacing={10} style={styles.circleInfo}>
                    <Users size={18} color={Colors.primary[400]} />
                    <Text textStyle={styles.circleName}>{circle.name}</Text>
                  </Row>
                  <Text textStyle={styles.circleCount}>
                    {circle.memberCount === 1 ? '1 member' : `${circle.memberCount} members`}
                  </Text>
                </View>
              ))}
              <Text textStyle={styles.totalCount}>
                {totalMembers === 1
                  ? '1 person will be notified'
                  : `${totalMembers} people will be notified`}
              </Text>
            </Column>
          ) : (
            <View style={styles.emptyCard}>
              <Text textStyle={styles.emptyText}>
                You are not in any circles yet. Create or join a circle to use SOS.
              </Text>
              <TouchableOpacity
                style={styles.emptyAction}
                onPress={() => router.replace('/circles?action=join')}
              >
                <Text textStyle={styles.emptyActionText}>Go to Circles</Text>
              </TouchableOpacity>
            </View>
          )}
        </Column>

        <View style={styles.buttonSection}>
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={sending || sent || !circles.length}
            style={({ pressed }) => [
              styles.sosButtonOuter,
              (pressed || holding) && styles.sosButtonOuterActive,
              (sending || sent || !circles.length) && styles.sosButtonDisabled,
            ]}
          >
            <LinearGradient
              colors={sent ? ['#16A34A', '#15803D'] : ['#EF4444', '#B91C1C']}
              style={styles.sosButton}
            >
              {sending ? (
                <ActivityIndicator color={Colors.neutral[0]} size="large" />
              ) : (
                <Column spacing={8} alignment="center">
                  <Text textStyle={styles.sosLabel}>{sent ? 'SOS Sent' : 'SOS'}</Text>
                  <Text textStyle={styles.sosHint}>
                    {sent
                      ? 'Your circle members have been notified'
                      : holding
                        ? 'Keep holding...'
                        : 'Hold for 2 seconds'}
                  </Text>
                </Column>
              )}
            </LinearGradient>
            {!sent && holding ? (
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${holdProgress * 100}%` }]} />
              </View>
            ) : null}
          </Pressable>
        </View>
      </Column>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[950],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[800],
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.neutral[800],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.neutral[0],
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  warningCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: '#450A0A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#7F1D1D',
  },
  warningText: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FECACA',
  },
  warningBody: {
    fontSize: 14,
    color: '#FCA5A5',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral[400],
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  loader: {
    marginTop: 12,
  },
  circleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.neutral[900],
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.neutral[800],
  },
  circleInfo: {
    flex: 1,
    minWidth: 0,
  },
  circleName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[0],
    flexShrink: 1,
  },
  circleCount: {
    fontSize: 13,
    color: Colors.neutral[500],
    marginLeft: 12,
  },
  totalCount: {
    fontSize: 14,
    color: Colors.primary[400],
    fontWeight: '600',
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: Colors.neutral[900],
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.neutral[800],
    gap: 16,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.neutral[400],
    lineHeight: 22,
    textAlign: 'center',
  },
  emptyAction: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: Colors.primary[900],
    borderWidth: 1,
    borderColor: Colors.primary[700],
  },
  emptyActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary[400],
  },
  buttonSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 24,
  },
  sosButtonOuter: {
    width: 220,
    borderRadius: 110,
    overflow: 'hidden',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  sosButtonOuterActive: {
    transform: [{ scale: 0.97 }],
  },
  sosButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
  },
  sosButton: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  sosLabel: {
    fontSize: 42,
    fontWeight: '800',
    color: Colors.neutral[0],
    letterSpacing: 2,
  },
  sosHint: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.neutral[800],
  },
  progressFill: {
    height: 4,
    backgroundColor: Colors.neutral[0],
  },
});
