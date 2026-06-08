import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Users, Mail, UserPlus } from 'lucide-react-native';
import { Column, Text } from '@/components/ExpoUI';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import {
  loadFriendProfiles,
  loadPendingFriendRequests,
  processPendingFriendInvite,
  searchProfilesForFriends,
  sendFriendRequest,
} from '@/lib/friends';
import { getDisplayName } from '@/lib/profile';
import { Colors } from '@/lib/theme';
import { Profile } from '@/types/database';
import { ScreenHeader, HeaderActionButton } from '@/components/ui/ScreenHeader';
import { SafeAreaScreen } from '@/components/ui/SafeAreaScreen';
import { AddFriendModal } from '@/components/friends/AddFriendModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActionButtonGroup } from '@/components/ui/ActionButtonGroup';
import { GradientSubmitButton } from '@/components/ui/GradientSubmitButton';
import { FriendsSearchBar } from '@/components/friends/FriendsSearchBar';
import { FriendsTabBar } from '@/components/friends/FriendsTabBar';
import { FriendCard } from '@/components/friends/FriendCard';
import { FriendRequestCard } from '@/components/friends/FriendRequestCard';
import { SearchResultCard } from '@/components/friends/SearchResultCard';
import { FriendRequestWithProfile } from '@/components/friends/types';

type RequestListItem = FriendRequestWithProfile & { type: 'received' | 'sent' };

export default function FriendsScreen() {
  const { user, profile } = useAuth();
  const inviterName = getDisplayName(profile, user);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequestWithProfile[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequestWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [searching, setSearching] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    processPendingFriendInvite(user.id).then((result) => {
      if (result.sent) {
        Alert.alert(
          'Invite accepted',
          'You joined via a friend invite. They will see your friend request.'
        );
        loadFriendRequests();
      }
    });
  }, [user?.id]);

  async function loadData() {
    setLoading(true);
    await Promise.all([loadFriends(), loadFriendRequests()]);
    setLoading(false);
  }

  async function loadFriends() {
    if (!user?.id) {
      setFriends([]);
      return;
    }

    const profiles = await loadFriendProfiles(user.id);
    setFriends(profiles);
  }

  async function loadFriendRequests() {
    if (!user?.id) {
      setPendingRequests([]);
      setSentRequests([]);
      return;
    }

    const { received, sent } = await loadPendingFriendRequests(user.id);
    setPendingRequests(received as FriendRequestWithProfile[]);
    setSentRequests(sent as FriendRequestWithProfile[]);
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  async function searchUsers(query: string) {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await searchProfilesForFriends(query);
      setSearchResults(results);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Search failed');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function handleSendFriendRequest(receiverId: string) {
    if (!user?.id) {
      return;
    }

    const { error } = await sendFriendRequest(user.id, receiverId);
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    Alert.alert('Success', 'Friend request sent');
    loadFriendRequests();
    setSearchQuery('');
    setSearchResults([]);
  }

  async function acceptRequest(requestId: string) {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (error) {
      Alert.alert('Error', 'Failed to accept request');
      return;
    }

    loadData();
  }

  async function rejectRequest(requestId: string) {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (error) {
      Alert.alert('Error', 'Failed to reject request');
      return;
    }

    loadFriendRequests();
  }

  async function cancelRequest(requestId: string) {
    const { error } = await supabase.from('friend_requests').delete().eq('id', requestId);
    if (error) {
      Alert.alert('Error', 'Failed to cancel request');
      return;
    }
    loadFriendRequests();
  }

  async function removeFriend(friendId: string) {
    Alert.alert('Remove Friend', 'Are you sure you want to remove this friend?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('friend_requests')
            .delete()
            .or(
              `and(sender_id.eq.${user?.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user?.id})`
            );

          if (error) {
            Alert.alert('Error', 'Failed to remove friend');
            return;
          }

          loadData();
        },
      },
    ]);
  }

  const isAlreadyRequested = (profileId: string) =>
    sentRequests.some((req) => req.receiver_id === profileId);

  const isAlreadyFriend = (profileId: string) => friends.some((f) => f.id === profileId);

  const requestItems: RequestListItem[] = [
    ...pendingRequests.map((r) => ({ ...r, type: 'received' as const })),
    ...sentRequests.map((r) => ({ ...r, type: 'sent' as const })),
  ];

  return (
    <SafeAreaScreen edges={['top']} style={styles.container}>
      <ScreenHeader
        title="Friends"
        compactTop
        action={
          <HeaderActionButton
            onPress={() => setShowAddFriendModal(true)}
            accessibilityLabel="Add friend"
          >
            <UserPlus size={22} color={Colors.neutral[0]} />
          </HeaderActionButton>
        }
      />

      <FriendsSearchBar
        value={searchQuery}
        onChangeText={searchUsers}
        onClear={() => {
          setSearchQuery('');
          setSearchResults([]);
        }}
      />

      {searchQuery.length > 0 ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SearchResultCard
              profile={item}
              isFriend={isAlreadyFriend(item.id)}
              isPending={isAlreadyRequested(item.id)}
              onAdd={handleSendFriendRequest}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !searching ? (
              <Column spacing={8} alignment="center" style={styles.searchEmpty}>
                <Text textStyle={styles.searchEmptyText}>
                  No users found matching "{searchQuery}"
                </Text>
              </Column>
            ) : null
          }
        />
      ) : (
        <>
          <FriendsTabBar
            activeTab={activeTab}
            friendsCount={friends.length}
            requestsCount={pendingRequests.length + sentRequests.length}
            onTabChange={setActiveTab}
          />

          {activeTab === 'friends' ? (
            <FlatList
              data={friends}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <FriendCard profile={item} onRemove={removeFriend} />
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={Colors.primary[500]}
                />
              }
              ListEmptyComponent={
                !loading ? (
                  <EmptyState
                    icon={<Users size={48} color={Colors.neutral[600]} />}
                    title="No Friends Yet"
                    description="Search for friends on LocateMate, or invite people from your contacts."
                    action={
                      <ActionButtonGroup>
                        <GradientSubmitButton
                          label="Add Friend"
                          onPress={() => setShowAddFriendModal(true)}
                          icon={<UserPlus size={20} color={Colors.neutral[0]} />}
                        />
                      </ActionButtonGroup>
                    }
                  />
                ) : null
              }
            />
          ) : (
            <FlatList
              data={requestItems}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <FriendRequestCard
                  request={item}
                  variant={item.type}
                  onAccept={acceptRequest}
                  onReject={rejectRequest}
                  onCancel={cancelRequest}
                />
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={Colors.primary[500]}
                />
              }
              ListEmptyComponent={
                !loading ? (
                  <EmptyState
                    icon={<Mail size={48} color={Colors.neutral[600]} />}
                    title="No Requests"
                    description="Incoming and outgoing friend requests will show up here."
                  />
                ) : null
              }
            />
          )}
        </>
      )}
      <AddFriendModal
        visible={showAddFriendModal}
        userId={user?.id || ''}
        inviterName={inviterName}
        friends={friends}
        sentRequestReceiverIds={sentRequests.map((request) => request.receiver_id)}
        onClose={() => setShowAddFriendModal(false)}
        onFriendRequestSent={loadFriendRequests}
      />
    </SafeAreaScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  searchEmpty: {
    paddingTop: 40,
  },
  searchEmptyText: {
    fontSize: 16,
    color: Colors.neutral[500],
    textAlign: 'center',
  },
});
