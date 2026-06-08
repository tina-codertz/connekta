import React from 'react';
import { View } from 'react-native';
import { UserPlus, Check, Clock } from 'lucide-react-native';
import { Column, Row, Text } from '@/components/ExpoUI';
import { Avatar } from '@/components/ui/Avatar';
import { IconActionButton } from '@/components/ui/IconActionButton';
import { listCardStyles } from '@/components/ui/listCardStyles';
import { getDisplayName } from '@/lib/profile';
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
      {isFriend ? (
        <Row spacing={4} alignment="center" style={listCardStyles.badge}>
          <Check size={14} color={Colors.secondary[500]} />
          <Text textStyle={[listCardStyles.badgeText, { color: Colors.secondary[500] }]}>
            Friends
          </Text>
        </Row>
      ) : isPending ? (
        <Row spacing={4} alignment="center" style={listCardStyles.badge}>
          <Clock size={14} color={Colors.warning} />
          <Text textStyle={[listCardStyles.badgeText, { color: Colors.warning }]}>Pending</Text>
        </Row>
      ) : (
        <IconActionButton variant="primary" onPress={() => onAdd(profile.id)}>
          <UserPlus size={18} color={Colors.primary[400]} />
        </IconActionButton>
      )}
    </View>
  );
}
