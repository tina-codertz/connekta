import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  FlatList,
  SectionList,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  View,
} from 'react-native';
import { Contact, Search, UserPlus } from 'lucide-react-native';
import { Text } from '@/components/ExpoUI';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { FriendsSearchBar } from '@/components/friends/FriendsSearchBar';
import { SearchResultCard } from '@/components/friends/SearchResultCard';
import { ContactInviteCard } from '@/components/friends/ContactInviteCard';
import { DeviceContact, loadDeviceContacts } from '@/lib/contacts';
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
  inviterName: string;
  friends: Profile[];
  sentRequestReceiverIds: string[];
  onClose: () => void;
  onFriendRequestSent: () => void;
}

type AddFriendTab = 'search' | 'contacts';

type ContactSectionItem =
  | { kind: 'profile'; profile: Profile }
  | { kind: 'contact'; contact: DeviceContact };

interface ContactSection {
  title: string;
  data: ContactSectionItem[];
}

function EmptyPanel({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.emptyPanel}>
      <View style={styles.emptyIcon}>{icon}</View>
      <Text textStyle={styles.emptyTitle}>{title}</Text>
      <Text textStyle={styles.emptyDescription}>{description}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.emptyAction} onPress={onAction}>
          <Text textStyle={styles.emptyActionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function AddFriendModal({
  visible,
  userId,
  inviterName,
  friends,
  sentRequestReceiverIds,
  onClose,
  onFriendRequestSent,
}: AddFriendModalProps) {
  const [activeTab, setActiveTab] = useState<AddFriendTab>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [contactMatches, setContactMatches] = useState<Profile[]>([]);
  const [unmatchedContacts, setUnmatchedContacts] = useState<DeviceContact[]>([]);
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
      setUnmatchedContacts([]);
      setContactsLoaded(false);
      setContactMessage(null);
    }
  }, [visible]);

  const isAlreadyFriend = (profileId: string) => friends.some((friend) => friend.id === profileId);
  const isAlreadyRequested = (profileId: string) => sentRequestReceiverIds.includes(profileId);

  const contactSections = useMemo<ContactSection[]>(() => {
    const sections: ContactSection[] = [];

    if (contactMatches.length) {
      sections.push({
        title: 'On LocateMate',
        data: contactMatches.map((profile) => ({ kind: 'profile', profile })),
      });
    }

    if (unmatchedContacts.length) {
      sections.push({
        title: 'Invite via WhatsApp or Message',
        data: unmatchedContacts.map((contact) => ({ kind: 'contact', contact })),
      });
    }

    return sections;
  }, [contactMatches, unmatchedContacts]);

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
      setUnmatchedContacts([]);
      setContactsLoaded(true);
      setLoadingContacts(false);
      return;
    }

    const emails = contacts.flatMap((contact) => contact.emails);

    try {
      const matches = await findProfilesByEmails(emails);
      const matchedEmails = new Set(
        matches.map((profile) => profile.email?.toLowerCase()).filter(Boolean) as string[]
      );
      const unmatched = contacts.filter(
        (contact) => !contact.emails.some((email) => matchedEmails.has(email))
      );

      setContactMatches(matches);
      setUnmatchedContacts(unmatched);
      setContactMessage(
        `${matches.length} on LocateMate · ${unmatched.length} to invite`
      );
    } catch (matchError) {
      Alert.alert(
        'Error',
        matchError instanceof Error ? matchError.message : 'Failed to match contacts'
      );
      setContactMatches([]);
      setUnmatchedContacts([]);
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

  function renderProfileCard(profile: Profile) {
    return (
      <SearchResultCard
        profile={profile}
        isFriend={isAlreadyFriend(profile.id)}
        isPending={isAlreadyRequested(profile.id)}
        onAdd={handleSendRequest}
      />
    );
  }

  return (
    <ModalSheet visible={visible} title="Add Friend" onClose={onClose}>
      <SegmentedTabs
        tabs={[
          { id: 'search', label: 'Search' },
          { id: 'contacts', label: 'Contacts' },
        ]}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as AddFriendTab)}
      />

      {activeTab === 'search' ? (
        <View style={styles.tabContent}>
          <FriendsSearchBar
            value={searchQuery}
            onChangeText={handleSearch}
            onClear={() => {
              setSearchQuery('');
              setSearchResults([]);
            }}
          />

          {searchQuery.length === 0 ? (
            <EmptyPanel
              icon={<Search size={32} color={Colors.neutral[600]} />}
              title="Find friends on LocateMate"
              description="Search by email or name. For people without the app, use Contacts to send them your invite link."
              actionLabel="Go to Contacts"
              onAction={() => setActiveTab('contacts')}
            />
          ) : searching ? (
            <View style={styles.loadingPanel}>
              <ActivityIndicator color={Colors.primary[500]} size="large" />
              <Text textStyle={styles.loadingText}>Searching...</Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => renderProfileCard(item)}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <EmptyPanel
                  icon={<UserPlus size={32} color={Colors.neutral[600]} />}
                  title="No matches"
                  description={`Nobody found for "${searchQuery}". Try inviting them from your contacts instead.`}
                  actionLabel="Go to Contacts"
                  onAction={() => setActiveTab('contacts')}
                />
              }
            />
          )}
        </View>
      ) : null}

      {activeTab === 'contacts' ? (
        <View style={styles.tabContent}>
          <View style={styles.contactsHeader}>
            <Text textStyle={styles.contactsHint}>
              Load your contacts to add people on LocateMate, or send your invite link through
              WhatsApp or Messages.
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
                    {contactsLoaded ? 'Refresh contacts' : 'Load contacts'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            {contactMessage ? (
              <Text textStyle={styles.contactMessage}>{contactMessage}</Text>
            ) : null}
          </View>

          {!contactsLoaded && !loadingContacts ? (
            <EmptyPanel
              icon={<Contact size={32} color={Colors.neutral[600]} />}
              title="Use your contacts"
              description="Tap Load contacts, then pick someone and send your invite via WhatsApp or Message."
            />
          ) : (
            <SectionList
              sections={contactSections}
              keyExtractor={(item, index) =>
                item.kind === 'profile'
                  ? item.profile.id
                  : `invite-${item.contact.id}-${index}`
              }
              renderSectionHeader={({ section }) => (
                <Text textStyle={styles.sectionTitle}>{section.title}</Text>
              )}
              renderItem={({ item }) =>
                item.kind === 'profile' ? (
                  renderProfileCard(item.profile)
                ) : (
                  <ContactInviteCard
                    contact={item.contact}
                    inviterUserId={userId}
                    inviterName={inviterName}
                  />
                )
              }
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              stickySectionHeadersEnabled={false}
              ListEmptyComponent={
                contactsLoaded && !loadingContacts ? (
                  <EmptyPanel
                    icon={<Contact size={32} color={Colors.neutral[600]} />}
                    title="No contacts to show"
                    description="None of your contacts matched, or contact access was denied."
                  />
                ) : null
              }
            />
          )}
        </View>
      ) : null}
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
  },
  contactsHeader: {
    paddingHorizontal: 24,
    marginBottom: 12,
    gap: 12,
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
    fontSize: 13,
    color: Colors.neutral[500],
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 8,
  },
  emptyPanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.neutral[900],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral[0],
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    color: Colors.neutral[500],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  emptyAction: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: Colors.neutral[900],
    borderWidth: 1,
    borderColor: Colors.neutral[700],
  },
  emptyActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary[400],
  },
  loadingPanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 48,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.neutral[500],
  },
});
