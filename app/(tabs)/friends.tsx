import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Users, Mail } from 'lucide-react-native';
import { Column, Text } from '@/components/ExpoUI';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/lib/theme';
import { Profile } from '@/types/database';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { FriendsSearchBar } from '@/components/friends/FriendsSearchBar';
import { FriendsTabBar } from '@/components/friends/FriendsTabBar';
import { FriendCard } from '@/components/friends/FriendCard';
import { FriendRequestCard } from '@/components/friends/FriendRequestCard';
import { SearchResultCard } from '@/components/friends/SearchResultCard';
import { FriendRequestWithProfile } from '@/components/friends/types';

type RequestListItem = FriendRequestWithProfile & { type: 'received' | 'sent' };

export default function FriendsScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequestWithProfile[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequestWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    await Promise.all([loadFriends(), loadFriendRequests()]);
    setLoading(false);
  }

  async function loadFriends() {
    const { data: acceptedRequests } = await supabase
      .from('friend_requests')
      .select('sender_id, receiver_id')
      .eq('status', 'accepted')
      .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`);

    if (!acceptedRequests || acceptedRequests.length === 0) {
      setFriends([]);
      return;
    }

    const friendIds = acceptedRequests.map((req) =>
      req.sender_id === user?.id ? req.receiver_id : req.sender_id
    );

    const { data: profiles } = await supabase.from('profiles').select('*').in('id', friendIds);

    setFriends(profiles || []);
  }

  async function loadFriendRequests() {
    const { data: received } = await supabase
      .from('friend_requests')
      .select('*, sender:profiles!friend_requests_sender_id_fkey(*)')
      .eq('receiver_id', user?.id)
      .eq('status', 'pending');

    const { data: sent } = await supabase
      .from('friend_requests')
      .select('*, receiver:profiles!friend_requests_receiver_id_fkey(*)')
      .eq('sender_id', user?.id)
      .eq('status', 'pending');

    setPendingRequests((received as FriendRequestWithProfile[]) || []);
    setSentRequests((sent as FriendRequestWithProfile[]) || []);
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
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
      .neq('id', user?.id)
      .limit(10);

    setSearchResults(data || []);
    setSearching(false);
  }

  async function sendFriendRequest(receiverId: string) {
    const { error } = await supabase.from('friend_requests').insert({
      sender_id: user!.id,
      receiver_id: receiverId,
    });

    if (error) {
      if (error.code === '23505') {
        Alert.alert('Already Sent', 'You have already sent a request to this user');
      } else {
        Alert.alert('Error', 'Failed to send friend request');
      }
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
    <View style={styles.container}>
      <ScreenHeader title="Friends" />

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
              onAdd={sendFriendRequest}
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
                    description="Search for users by email or name to add them as friends"
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
                    title="No Pending Requests"
                    description="Friend requests will appear here"
                  />
                ) : null
              }
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[950],
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
