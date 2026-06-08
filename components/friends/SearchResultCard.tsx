import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { UserPlus, Check, Clock } from 'lucide-react-native';
import { Column, Row, Text } from '@/components/ExpoUI';
import { Avatar } from '@/components/ui/Avatar';
import { Profile } from '@/types/database';
import { Colors } from '@/lib/theme';

interface SearchResultCardProps {
  profile: Profile;
  isFriend: boolean;
  isPending: boolean;
  onAdd: (id: string) => void;
}

export function SearchResultCard({
  profile,
  isFriend,
  isPending,
  onAdd,
}: SearchResultCardProps) {
  return (
    <View style={styles.card}>
      <Avatar name={profile.full_name} imageUrl={profile.avatar_url} style={styles.avatar} />
      <Column spacing={2} style={styles.info}>
        <Text textStyle={styles.name}>{profile.full_name || 'Unknown'}</Text>
        <Text textStyle={styles.email}>{profile.email}</Text>
      </Column>
      {isFriend ? (
        <Row spacing={4} alignment="center" style={styles.badge}>
          <Check size={14} color={Colors.secondary[500]} />
          <Text textStyle={styles.friendBadgeText}>Friends</Text>
        </Row>
      ) : isPending ? (
        <Row spacing={4} alignment="center" style={styles.badge}>
          <Clock size={14} color={Colors.warning} />
          <Text textStyle={styles.pendingBadgeText}>Pending</Text>
        </Row>
      ) : (
        <TouchableOpacity style={styles.addButton} onPress={() => onAdd(profile.id)}>
          <UserPlus size={18} color={Colors.primary[400]} />
        </TouchableOpacity>
      )}
    </View>
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
  avatar: { marginRight: 16 },
  info: { flex: 1 },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[0],
  },
  email: {
    fontSize: 12,
    color: Colors.neutral[500],
  },
  badge: {
    backgroundColor: Colors.neutral[800],
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  friendBadgeText: {
    fontSize: 12,
    color: Colors.secondary[500],
    fontWeight: '600',
  },
  pendingBadgeText: {
    fontSize: 12,
    color: Colors.warning,
    fontWeight: '600',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.neutral[800],
    justifyContent: 'center',
    alignItems: 'center',
  },
});
