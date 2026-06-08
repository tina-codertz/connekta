import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Battery, BatteryCharging } from 'lucide-react-native';
import { Column, Row, Text } from '@/components/ExpoUI';
import { Avatar } from '@/components/ui/Avatar';
import { FriendMarker } from './types';
import { formatLastSeen, getBatteryColor } from './utils';
import { Colors } from '@/lib/theme';

interface FriendLocationCardProps {
  friend: FriendMarker;
  selected: boolean;
  onPress: () => void;
}

export function FriendLocationCard({ friend, selected, onPress }: FriendLocationCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
    >
      <View style={styles.avatarWrapper}>
        <Avatar name={friend.name} imageUrl={friend.avatar} style={styles.avatar} />
        <View style={styles.onlineIndicator} />
      </View>

      <Column spacing={2} style={styles.info}>
        <Text textStyle={styles.name}>{friend.name}</Text>
        <Row spacing={4} alignment="center">
          <MapPin size={12} color={Colors.neutral[500]} />
          <Text textStyle={styles.coords}>
            {friend.latitude.toFixed(4)}, {friend.longitude.toFixed(4)}
          </Text>
        </Row>
      </Column>

      <Column spacing={2} alignment="end">
        <Row spacing={4} alignment="center">
          {friend.isCharging ? (
            <BatteryCharging size={20} color={getBatteryColor(friend.battery)} />
          ) : (
            <Battery size={20} color={getBatteryColor(friend.battery)} />
          )}
          {friend.battery !== null && (
            <Text textStyle={[styles.battery, { color: getBatteryColor(friend.battery) }]}>
              {friend.battery}%
            </Text>
          )}
        </Row>
        <Text textStyle={styles.lastSeen}>{formatLastSeen(friend.lastSeen)}</Text>
      </Column>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[900],
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.neutral[800],
  },
  cardSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.neutral[800],
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {},
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.neutral[900],
  },
  info: { flex: 1 },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[0],
  },
  coords: {
    fontSize: 12,
    color: Colors.neutral[500],
  },
  battery: {
    fontSize: 12,
    fontWeight: '600',
  },
  lastSeen: {
    fontSize: 12,
    color: Colors.neutral[500],
  },
});
