import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell, Search } from 'lucide-react-native';
import { Column, Row, Text } from '@/components/ExpoUI';
import { Colors } from '@/lib/theme';
import { useScreenInsets } from '@/hooks/useScreenInsets';
import { getGreeting } from './utils';
import { getDisplayName } from '@/lib/profile';
import type { Profile } from '@/types/database';
import type { User } from '@supabase/supabase-js';

interface MapHeaderProps {
  profile?: Profile | null;
  user?: User | null;
  unreadCount?: number;
  onNotificationsPress?: () => void;
  onSearchPress?: () => void;
  compactTop?: boolean;
}

export function MapHeader({
  profile,
  user,
  unreadCount = 0,
  onNotificationsPress,
  onSearchPress,
  compactTop,
}: MapHeaderProps) {
  const { headerPaddingTop } = useScreenInsets();

  return (
    <View
      style={[styles.header, { paddingTop: compactTop ? 16 : headerPaddingTop }]}
    >
      <Column spacing={2}>
        <Text textStyle={styles.greeting}>Good {getGreeting()}</Text>
        <Text textStyle={styles.name}>{getDisplayName(profile, user)}</Text>
      </Column>
      <Row spacing={8}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onNotificationsPress}
          accessibilityLabel="Open notifications"
        >
          <Bell size={24} color={Colors.neutral[0]} />
          {unreadCount > 0 ? <View style={styles.notificationDot} /> : null}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onSearchPress}
          accessibilityLabel="Search map"
        >
          <Search size={24} color={Colors.neutral[0]} />
        </TouchableOpacity>
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 14,
    color: Colors.neutral[400],
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.neutral[0],
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.neutral[800],
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
});
