import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { setPendingFriendInviter } from '@/lib/pending-friend-invite';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/lib/theme';

export default function InviteScreen() {
  const { from } = useLocalSearchParams<{ from?: string | string[] }>();
  const { user, loading } = useAuth();
  const inviterId = Array.isArray(from) ? from[0] : from;

  useEffect(() => {
    if (inviterId?.trim()) {
      setPendingFriendInviter(inviterId.trim());
    }
  }, [inviterId]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)/friends" />;
  }

  return <Redirect href="/(auth)" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral[950],
  },
});
