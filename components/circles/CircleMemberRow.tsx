import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Crown, Shield } from 'lucide-react-native';
import { Row, Text } from '@/components/ExpoUI';
import { Avatar } from '@/components/ui/Avatar';
import { Colors } from '@/lib/theme';
import { Profile } from '@/types/database';

interface CircleMemberRowProps {
  profile: Profile;
  role: string;
}

function RoleIcon({ role }: { role: string }) {
  if (role === 'owner') return <Crown size={14} color={Colors.warning} />;
  if (role === 'admin') return <Shield size={14} color={Colors.primary[400]} />;
  return null;
}

export function CircleMemberRow({ profile, role }: CircleMemberRowProps) {
  return (
    <View style={styles.row}>
      <Avatar
        name={profile.full_name}
        imageUrl={profile.avatar_url}
        size={44}
        style={styles.avatar}
      />
      <View style={styles.info}>
        <Row spacing={4} alignment="center">
          <Text textStyle={styles.name}>{profile.full_name || 'Unknown'}</Text>
          <RoleIcon role={role} />
        </Row>
        <Text textStyle={styles.email}>{profile.email}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[900],
    borderRadius: 12,
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
});
