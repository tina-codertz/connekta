import React from 'react';
import { View } from 'react-native';
import { Crown, Shield } from 'lucide-react-native';
import { Row, Text } from '@/components/ExpoUI';
import { Avatar } from '@/components/ui/Avatar';
import { listCardStyles } from '@/components/ui/listCardStyles';
import { Colors } from '@/lib/theme';
import { getDisplayName } from '@/lib/profile';
import { Profile } from '@/types/database';

interface CircleMemberRowProps {
  profile: Profile | null | undefined;
  role: string;
}

function RoleIcon({ role }: { role: string }) {
  if (role === 'owner') return <Crown size={14} color={Colors.warning} />;
  if (role === 'admin') return <Shield size={14} color={Colors.primary[400]} />;
  return null;
}

export function CircleMemberRow({ profile, role }: CircleMemberRowProps) {
  const displayName = getDisplayName(profile);

  return (
    <View style={listCardStyles.card}>
      <Avatar
        name={displayName}
        imageUrl={profile?.avatar_url}
        size={44}
        style={listCardStyles.avatar}
      />
      <View style={listCardStyles.info}>
        <Row spacing={4} alignment="center">
          <Text textStyle={listCardStyles.name} numberOfLines={1}>
            {displayName}
          </Text>
          <RoleIcon role={role} />
        </Row>
        {profile?.email ? (
          <Text textStyle={listCardStyles.subtitle} numberOfLines={1}>
            {profile.email}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
