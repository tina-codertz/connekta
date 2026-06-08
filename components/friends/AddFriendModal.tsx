import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Contact, Search } from 'lucide-react-native';
import { Column, Text } from '@/components/ExpoUI';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { FriendsSearchBar } from '@/components/friends/FriendsSearchBar';
import { SearchResultCard } from '@/components/friends/SearchResultCard';
import { loadDeviceContacts } from '@/lib/contacts';
import {
  findProfilesByEmails,
  searchProfilesForFriends,
  sendFriendRequest,
} from '@/lib/friends';
import { Profile } from '@/types/database';
import { Colors } from '@/lib/theme';

interface AddFriendModalProps {
  visible: boolean;
  userId: string;
  friends: Profile[];
  sentRequestReceiverIds: string[];
  onClose: () => void;
  onFriendRequestSent: () => void;
}

export function AddFriendModal({
  visible,
  userId,
  friends,
  sentRequestReceiverIds,
  onClose,
  onFriendRequestSent,
}: AddFriendModalProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'contacts'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [contactMatches, setContactMatches] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactsLoaded, setContactsLoaded] = useState(false);
  const [contactMessage, setContactMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setActiveTab('search');
      setSearchQuery('');
      setSearchResults([]);
      setContactMatches([]);
      setContactsLoaded(false);
      setContactMessage(null);
    }
  }, [visible]);

  const isAlreadyFriend = (profileId: string) => friends.some((friend) => friend.id === profileId);
  const isAlreadyRequested = (profileId: string) => sentRequestReceiverIds.includes(profileId);

  async function handleSearch(query: string) {
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

  async function handleLoadContacts() {
    setLoadingContacts(true);
    setContactMessage(null);

    const { contacts, error } = await loadDeviceContacts();
    if (error) {
      setContactMessage(error);
      setContactMatches([]);
      setContactsLoaded(true);
      setLoadingContacts(false);
      return;
    }

    const emails = contacts.flatMap((contact) => contact.emails);

    try {
      const matches = await findProfilesByEmails(emails);
      setContactMatches(matches);
      setContactMessage(
        matches.length
          ? `${matches.length} contact${matches.length === 1 ? '' : 's'} on LocateMate`
          : 'No contacts found on LocateMate yet'
      );
    } catch (matchError) {
      Alert.alert(
        'Error',
        matchError instanceof Error ? matchError.message : 'Failed to match contacts'
      );
      setContactMatches([]);
    }

    setContactsLoaded(true);
    setLoadingContacts(false);
  }

  async function handleSendRequest(receiverId: string) {
    const { error } = await sendFriendRequest(userId, receiverId);
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    Alert.alert('Success', 'Friend request sent');
    onFriendRequestSent();
    setSearchQuery('');
    setSearchResults([]);
  }

  const listData = activeTab === 'search' ? searchResults : contactMatches;

  return (
    <ModalSheet visible={visible} title="Add Friend" onClose={onClose}>
      <SegmentedTabs
        tabs={[
          { id: 'search', label: 'Search' },
          { id: 'contacts', label: 'Contacts' },
        ]}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as 'search' | 'contacts')}
      />

      {activeTab === 'search' ? (
        <FriendsSearchBar
          value={searchQuery}
          onChangeText={handleSearch}
          onClear={() => {
            setSearchQuery('');
            setSearchResults([]);
          }}
        />
      ) : (
        <Column spacing={12} style={styles.contactsHeader}>
          <Text textStyle={styles.contactsHint}>
            Find people from your phone contacts who already use LocateMate.
          </Text>
          <TouchableOpacity
            style={styles.contactsButton}
            onPress={handleLoadContacts}
            disabled={loadingContacts}
          >
            {loadingContacts ? (
              <ActivityIndicator color={Colors.neutral[0]} />
            ) : (
              <>
                <Contact size={18} color={Colors.neutral[0]} />
                <Text textStyle={styles.contactsButtonText}>
                  {contactsLoaded ? 'Refresh Contacts' : 'Load from Contacts'}
                </Text>
              </>
            )}
          </TouchableOpacity>
          {contactMessage ? <Text textStyle={styles.contactMessage}>{contactMessage}</Text> : null}
        </Column>
      )}

      {activeTab === 'search' && searchQuery.length === 0 ? (
        <Column spacing={8} alignment="center" style={styles.placeholder}>
          <Search size={40} color={Colors.neutral[700]} />
          <Text textStyle={styles.placeholderText}>Search by email or name to add a friend</Text>
        </Column>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SearchResultCard
              profile={item}
              isFriend={isAlreadyFriend(item.id)}
              isPending={isAlreadyRequested(item.id)}
              onAdd={handleSendRequest}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            activeTab === 'search' && !searching ? (
              <Text textStyle={styles.emptyText}>No users found matching "{searchQuery}"</Text>
            ) : activeTab === 'contacts' && contactsLoaded && !loadingContacts ? (
              <Text textStyle={styles.emptyText}>
                None of your contacts are on LocateMate yet. Share the app with them first.
              </Text>
            ) : null
          }
        />
      )}
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  contactsHeader: {
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  contactsHint: {
    fontSize: 14,
    color: Colors.neutral[400],
    lineHeight: 20,
  },
  contactsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary[600],
    borderRadius: 12,
    paddingVertical: 14,
  },
  contactsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[0],
  },
  contactMessage: {
    fontSize: 14,
    color: Colors.neutral[500],
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  placeholder: {
    paddingTop: 48,
    paddingHorizontal: 24,
  },
  placeholderText: {
    fontSize: 15,
    color: Colors.neutral[500],
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: Colors.neutral[500],
    textAlign: 'center',
    paddingTop: 32,
    paddingHorizontal: 24,
  },
});
