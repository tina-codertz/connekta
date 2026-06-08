import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import { Column, Text } from '@/components/ExpoUI';
import { Avatar } from '@/components/ui/Avatar';
import { Profile } from '@/types/database';
import { Colors } from '@/lib/theme';

interface FriendCardProps {
  profile: Profile;
  onRemove: (id: string) => void;
}

export function FriendCard({ profile, onRemove }: FriendCardProps) {
  return (
    <View style={styles.card}>
      <Avatar name={profile.full_name} imageUrl={profile.avatar_url} style={styles.avatar} />
      <Column spacing={2} style={styles.info}>
        <Text textStyle={styles.name}>{profile.full_name || 'Unknown'}</Text>
        <Text textStyle={styles.email}>{profile.email}</Text>
      </Column>
      <TouchableOpacity style={styles.removeButton} onPress={() => onRemove(profile.id)}>
        <X size={18} color={Colors.neutral[500]} />
      </TouchableOpacity>
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
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.neutral[800],
    justifyContent: 'center',
    alignItems: 'center',
  },
});
