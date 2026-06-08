import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Battery, BatteryCharging, MapPinOff } from 'lucide-react-native';
import { Column, Row, Text } from '@/components/ExpoUI';
import { Avatar } from '@/components/ui/Avatar';
import { listCardStyles } from '@/components/ui/listCardStyles';
import { CircleMemberLocation } from './types';
import { formatLastSeen, getBatteryColor } from './utils';
import { Colors } from '@/lib/theme';

interface FriendLocationCardProps {
  member: CircleMemberLocation;
  selected: boolean;
  isSelf?: boolean;
  onPress?: () => void;
}

export function FriendLocationCard({
  member,
  selected,
  isSelf = false,
  onPress,
}: FriendLocationCardProps) {
  const showLocation = member.canViewLocation && member.latitude !== null && member.longitude !== null;

  return (
    <TouchableOpacity
      style={[listCardStyles.card, selected && styles.cardSelected]}
      onPress={onPress}
      disabled={!onPress || !showLocation}
      activeOpacity={showLocation ? 0.7 : 1}
    >
      <View style={styles.avatarWrapper}>
        <Avatar name={member.name} imageUrl={member.avatar} size={44} />
        <View
          style={[
            styles.statusIndicator,
            showLocation ? styles.statusOnline : styles.statusOffline,
          ]}
        />
      </View>

      <Column spacing={2} style={listCardStyles.info}>
        <Text textStyle={listCardStyles.name} numberOfLines={1}>
          {isSelf ? `${member.name} (You)` : member.name}
        </Text>
        <Row spacing={4} alignment="center">
          {showLocation ? (
            <>
              <MapPin size={12} color={Colors.neutral[500]} />
              <Text textStyle={listCardStyles.subtitle} numberOfLines={1}>
                {member.latitude!.toFixed(4)}, {member.longitude!.toFixed(4)}
              </Text>
            </>
          ) : (
            <>
              <MapPinOff size={12} color={Colors.neutral[600]} />
              <Text textStyle={styles.unavailableText} numberOfLines={1}>
                {isSelf
                  ? 'Turn on location sharing in Settings'
                  : member.isSharing
                    ? 'Waiting for location...'
                    : 'Not sharing location'}
              </Text>
            </>
          )}
        </Row>
      </Column>

      <Column spacing={2} alignment="end">
        {showLocation ? (
          <>
            <Row spacing={4} alignment="center">
              {member.isCharging ? (
                <BatteryCharging size={20} color={getBatteryColor(member.battery)} />
              ) : (
                <Battery size={20} color={getBatteryColor(member.battery)} />
              )}
              {member.battery !== null && (
                <Text textStyle={[styles.battery, { color: getBatteryColor(member.battery) }]}>
                  {member.battery}%
                </Text>
              )}
            </Row>
            {member.lastSeen ? (
              <Text textStyle={listCardStyles.subtitle}>
                {formatLastSeen(member.lastSeen)}
              </Text>
            ) : null}
          </>
        ) : null}
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
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.neutral[900],
  },
  statusOnline: {
    backgroundColor: Colors.success,
  },
  statusOffline: {
    backgroundColor: Colors.neutral[600],
  },
  unavailableText: {
    fontSize: 12,
    color: Colors.neutral[600],
    flexShrink: 1,
  },
  battery: {
    fontSize: 12,
    fontWeight: '600',
  },
});
