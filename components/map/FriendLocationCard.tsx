import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Battery, BatteryCharging } from 'lucide-react-native';
import { Column, Row, Text } from '@/components/ExpoUI';
import { Avatar } from '@/components/ui/Avatar';
import { listCardStyles } from '@/components/ui/listCardStyles';
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
      style={[listCardStyles.card, selected && styles.cardSelected]}
      onPress={onPress}
    >
      <View style={styles.avatarWrapper}>
        <Avatar name={friend.name} imageUrl={friend.avatar} size={44} />
        <View style={styles.onlineIndicator} />
      </View>

      <Column spacing={2} style={listCardStyles.info}>
        <Text textStyle={listCardStyles.name} numberOfLines={1}>
          {friend.name}
        </Text>
        <Row spacing={4} alignment="center">
          <MapPin size={12} color={Colors.neutral[500]} />
          <Text textStyle={listCardStyles.subtitle} numberOfLines={1}>
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
        <Text textStyle={listCardStyles.subtitle}>{formatLastSeen(friend.lastSeen)}</Text>
      </Column>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.neutral[800],
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 16,
  },
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
  battery: {
    fontSize: 12,
    fontWeight: '600',
  },
});
