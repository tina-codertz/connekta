import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, FlatList, Alert, ActivityIndicator, View } from 'react-native';
import { UserPlus } from 'lucide-react-native';
import { Column, Text } from '@/components/ExpoUI';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { Avatar } from '@/components/ui/Avatar';
import { IconActionButton } from '@/components/ui/IconActionButton';
import { listCardStyles } from '@/components/ui/listCardStyles';
import { CircleInviteCodeCard } from './CircleInviteCodeCard';
import { CircleWithDetails } from './types';
import { addFriendToCircle } from '@/lib/circles';
import { loadFriendProfiles } from '@/lib/friends';
import { getDisplayName } from '@/lib/profile';
import { Profile } from '@/types/database';
import { Colors } from '@/lib/theme';

interface InviteToCircleModalProps {
  visible: boolean;
  circle: CircleWithDetails | null;
  userId: string;
  onClose: () => void;
  onMemberAdded: () => void;
}

export function InviteToCircleModal({
  visible,
  circle,
  userId,
  onClose,
  onMemberAdded,
}: InviteToCircleModalProps) {
  const [activeTab, setActiveTab] = useState<'friends' | 'code'>('friends');
  const [friends, setFriends] = useState<Profile[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [addingFriendId, setAddingFriendId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !userId) {
      return;
    }

    setLoadingFriends(true);
    loadFriendProfiles(userId)
      .then(setFriends)
      .finally(() => setLoadingFriends(false));
  }, [visible, userId]);

  const memberIds = useMemo(
    () => new Set((circle?.members ?? []).map((member) => member.user_id)),
    [circle?.members]
  );

  const friendsNotInCircle = useMemo(
    () => friends.filter((friend) => !memberIds.has(friend.id)),
    [friends, memberIds]
  );

  async function handleAddFriend(friendId: string) {
    if (!circle) {
      return;
    }

    setAddingFriendId(friendId);
    const { data, error } = await addFriendToCircle(circle.id, friendId);
    setAddingFriendId(null);

    if (error || !data) {
      Alert.alert('Error', error?.message || 'Failed to add friend to circle');
      return;
    }

    if (data.already_member) {
      Alert.alert('Already a member', 'This friend is already in the circle');
    } else {
      Alert.alert('Added', `${getDisplayName(friends.find((f) => f.id === friendId))} joined the circle`);
      onMemberAdded();
    }
  }

  if (!circle) {
    return null;
  }

  return (
    <ModalSheet visible={visible} title="Add to Circle" onClose={onClose}>
      <SegmentedTabs
        tabs={[
          { id: 'friends', label: 'Friends' },
          { id: 'code', label: 'Invite Code' },
        ]}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as 'friends' | 'code')}
      />

      {activeTab === 'friends' ? (
        <Column spacing={8} style={styles.section}>
          <Text textStyle={styles.hint}>
            Tap + to add a friend to this circle. Everyone else needs an invite code.
          </Text>

          {loadingFriends ? (
            <ActivityIndicator color={Colors.primary[500]} style={styles.loader} />
          ) : (
            <FlatList
              data={friendsNotInCircle}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const displayName = getDisplayName(item);
                const isAdding = addingFriendId === item.id;

                return (
                  <View style={listCardStyles.card}>
                    <Avatar
                      name={displayName}
                      imageUrl={item.avatar_url}
                      size={44}
                      style={listCardStyles.avatar}
                    />
                    <Column spacing={2} style={listCardStyles.info}>
                      <Text textStyle={listCardStyles.name} numberOfLines={1}>
                        {displayName}
                      </Text>
                      {item.email ? (
                        <Text textStyle={listCardStyles.subtitle} numberOfLines={1}>
                          {item.email}
                        </Text>
                      ) : null}
                    </Column>
                    <IconActionButton
                      variant="primary"
                      onPress={() => handleAddFriend(item.id)}
                      loading={isAdding}
                    >
                      <UserPlus size={18} color={Colors.primary[400]} />
                    </IconActionButton>
                  </View>
                );
              }}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text textStyle={styles.emptyText}>
                  {friends.length
                    ? 'All your friends are already in this circle.'
                    : 'Add friends on the Friends tab first, then add them here.'}
                </Text>
              }
            />
          )}
        </Column>
      ) : (
        <Column spacing={12} style={styles.section}>
          <Text textStyle={styles.hint}>
            Share this code with people who are not your friends. They can join from Circles → Join
            Circle.
          </Text>
          <CircleInviteCodeCard code={circle.invite_code} circleName={circle.name} />
        </Column>
      )}
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  section: {
    flex: 1,
    paddingHorizontal: 24,
  },
  hint: {
    fontSize: 14,
    color: Colors.neutral[400],
    lineHeight: 20,
    marginBottom: 8,
  },
  loader: {
    marginTop: 32,
  },
  listContent: {
    paddingBottom: 40,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.neutral[500],
    textAlign: 'center',
    paddingTop: 32,
    lineHeight: 22,
  },
});
