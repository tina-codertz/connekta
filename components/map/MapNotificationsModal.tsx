import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  FlatList,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import {
  AlertTriangle,
  BatteryLow,
  Bell,
  LogIn,
  LogOut,
} from 'lucide-react-native';
import { Column, Text } from '@/components/ExpoUI';
import { ModalSheet } from '@/components/ui/ModalSheet';
import {
  formatAlertTime,
  getAlertTypeLabel,
  loadMapAlerts,
  markAlertAsRead,
  markAllAlertsAsRead,
  MapAlertItem,
} from '@/lib/alerts';
import { Colors } from '@/lib/theme';
import type { Alert } from '@/types/database';

interface MapNotificationsModalProps {
  visible: boolean;
  userId: string;
  onClose: () => void;
  onAlertsChanged: () => void;
}

function AlertIcon({ type }: { type: Alert['type'] }) {
  const color = type === 'sos' ? '#FCA5A5' : Colors.primary[400];

  switch (type) {
    case 'sos':
      return <AlertTriangle size={20} color={color} />;
    case 'low_battery':
      return <BatteryLow size={20} color={color} />;
    case 'arrival':
      return <LogIn size={20} color={color} />;
    case 'departure':
      return <LogOut size={20} color={color} />;
    default:
      return <Bell size={20} color={color} />;
  }
}

export function MapNotificationsModal({
  visible,
  userId,
  onClose,
  onAlertsChanged,
}: MapNotificationsModalProps) {
  const [alerts, setAlerts] = useState<MapAlertItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAlerts = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const items = await loadMapAlerts(userId);
    setAlerts(items);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (visible) {
      loadAlerts();
    }
  }, [visible, loadAlerts]);

  async function handlePressAlert(alert: MapAlertItem) {
    if (!alert.is_read) {
      await markAlertAsRead(alert.id);
      setAlerts((prev) =>
        prev.map((item) => (item.id === alert.id ? { ...item, is_read: true } : item))
      );
      onAlertsChanged();
    }
  }

  async function handleMarkAllRead() {
    await markAllAlertsAsRead();
    setAlerts((prev) => prev.map((item) => ({ ...item, is_read: true })));
    onAlertsChanged();
  }

  const unreadCount = alerts.filter((alert) => !alert.is_read).length;

  return (
    <ModalSheet visible={visible} title="Notifications" onClose={onClose}>
      {unreadCount > 0 ? (
        <View style={styles.markAllRow}>
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text textStyle={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={Colors.primary[500]} style={styles.loader} />
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.alertCard, !item.is_read && styles.alertCardUnread]}
              onPress={() => handlePressAlert(item)}
            >
              <View
                style={[
                  styles.iconWrap,
                  item.type === 'sos' && styles.iconWrapSos,
                ]}
              >
                <AlertIcon type={item.type} />
              </View>
              <Column spacing={4} style={styles.alertInfo}>
                <Text textStyle={styles.alertTitle}>
                  {getAlertTypeLabel(item.type)} · {item.senderName}
                </Text>
                <Text textStyle={styles.alertCircle}>{item.circleName}</Text>
                {item.message ? (
                  <Text textStyle={styles.alertMessage} numberOfLines={2}>
                    {item.message}
                  </Text>
                ) : null}
                <Text textStyle={styles.alertTime}>{formatAlertTime(item.created_at)}</Text>
              </Column>
              {!item.is_read ? <View style={styles.unreadDot} /> : null}
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Column spacing={12} alignment="center" style={styles.emptyPanel}>
              <Bell size={40} color={Colors.neutral[700]} />
              <Text textStyle={styles.emptyTitle}>No notifications</Text>
              <Text textStyle={styles.emptyText}>
                SOS alerts and circle updates from your members will appear here.
              </Text>
            </Column>
          }
        />
      )}
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  markAllRow: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    alignItems: 'flex-end',
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary[400],
  },
  loader: {
    marginTop: 40,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    flexGrow: 1,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.neutral[900],
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.neutral[800],
  },
  alertCardUnread: {
    borderColor: Colors.primary[700],
    backgroundColor: Colors.neutral[800],
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral[800],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSos: {
    backgroundColor: '#450A0A',
  },
  alertInfo: {
    flex: 1,
    minWidth: 0,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.neutral[0],
  },
  alertCircle: {
    fontSize: 13,
    color: Colors.neutral[500],
  },
  alertMessage: {
    fontSize: 14,
    color: Colors.neutral[400],
    lineHeight: 20,
  },
  alertTime: {
    fontSize: 12,
    color: Colors.neutral[600],
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    marginTop: 6,
  },
  emptyPanel: {
    paddingTop: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral[0],
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: Colors.neutral[500],
    textAlign: 'center',
    lineHeight: 22,
  },
});
