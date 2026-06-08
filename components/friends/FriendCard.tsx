import React from 'react';
import { View } from 'react-native';
import { X } from 'lucide-react-native';
import { Column, Text } from '@/components/ExpoUI';
import { Avatar } from '@/components/ui/Avatar';
import { IconActionButton } from '@/components/ui/IconActionButton';
import { listCardStyles } from '@/components/ui/listCardStyles';
import { getDisplayName } from '@/lib/profile';
import { Profile } from '@/types/database';
import { Colors } from '@/lib/theme';

interface FriendCardProps {
  profile: Profile;
  onRemove: (id: string) => void;
}

export function FriendCard({ profile, onRemove }: FriendCardProps) {
  const displayName = getDisplayName(profile);

  return (
    <View style={listCardStyles.card}>
      <Avatar
        name={displayName}
        imageUrl={profile.avatar_url}
        size={44}
        style={listCardStyles.avatar}
      />
      <Column spacing={2} style={listCardStyles.info}>
        <Text textStyle={listCardStyles.name} numberOfLines={1}>
          {displayName}
        </Text>
        <Text textStyle={listCardStyles.subtitle} numberOfLines={1}>
          {profile.email}
        </Text>
      </Column>
      <IconActionButton onPress={() => onRemove(profile.id)}>
        <X size={18} color={Colors.neutral[500]} />
      </IconActionButton>
    </View>
  );
}
