import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Edit3, Camera } from 'lucide-react-native';
import { Column, Text } from '@/components/ExpoUI';
import { Avatar } from '@/components/ui/Avatar';
import type { User } from '@supabase/supabase-js';
import { Profile } from '@/types/database';
import { getDisplayName } from '@/lib/profile';
import { Colors } from '@/lib/theme';

interface ProfileCardProps {
  profile: Profile | null;
  user?: User | null;
  onPress: () => void;
}

export function ProfileCard({ profile, user, onPress }: ProfileCardProps) {
  const displayName = getDisplayName(profile, user);
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.avatarWrapper}>
        <Avatar
          name={displayName}
          imageUrl={profile?.avatar_url}
          size={64}
        />
        <TouchableOpacity style={styles.cameraButton}>
          <Camera size={16} color={Colors.neutral[0]} />
        </TouchableOpacity>
      </View>
      <Column spacing={4} style={styles.info}>
        <Text textStyle={styles.name}>{displayName}</Text>
        <Text textStyle={styles.email}>{profile?.email}</Text>
      </Column>
      <Edit3 size={20} color={Colors.neutral[500]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[900],
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.neutral[800],
  },
  avatarWrapper: {
    position: 'relative',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.neutral[900],
  },
  info: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral[0],
  },
  email: {
    fontSize: 14,
    color: Colors.neutral[500],
  },
});
