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
import { DeviceContact, filterDeviceContacts, loadDeviceContacts } from '@/lib/contacts';
import { phoneDigitsOnly } from '@/lib/app-invite';
import { matchContactsToProfiles, searchProfilesForFriends, sendFriendRequest } from '@/lib/friends';
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
  const [allContacts, setAllContacts] = useState<DeviceContact[]>([]);
  const [unmatchedContacts, setUnmatchedContacts] = useState<DeviceContact[]>([]);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
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
      setAllContacts([]);
      setUnmatchedContacts([]);
      setContactSearchQuery('');
      setContactsLoaded(false);
      setContactMessage(null);
    }
  }, [visible]);

  const isAlreadyFriend = (profileId: string) => friends.some((friend) => friend.id === profileId);
  const isAlreadyRequested = (profileId: string) => sentRequestReceiverIds.includes(profileId);

  const filteredUnmatchedContacts = useMemo(
    () => filterDeviceContacts(unmatchedContacts, contactSearchQuery),
    [contactSearchQuery, unmatchedContacts]
  );

  const contactSections = useMemo<ContactSection[]>(() => {
    const sections: ContactSection[] = [];

    if (contactMatches.length) {
      sections.push({
        title: 'On LocateMate',
        data: contactMatches.map((profile) => ({ kind: 'profile', profile })),
      });
    }

    if (filteredUnmatchedContacts.length) {
      sections.push({
        title: 'Invite via WhatsApp or Message',
        data: filteredUnmatchedContacts.map((contact) => ({ kind: 'contact', contact })),
      });
    }

    return sections;
  }, [contactMatches, filteredUnmatchedContacts]);

  function splitMatchedContacts(contacts: DeviceContact[], matches: Profile[]) {
    const matchedEmails = new Set(
      matches.map((profile) => profile.email?.trim().toLowerCase()).filter(Boolean) as string[]
    );
    const matchedPhoneDigits = new Set(
      matches
        .map((profile) => phoneDigitsOnly(profile.phone ?? ''))
        .filter((digits) => digits.length >= 7)
    );

    const unmatched = contacts.filter((contact) => {
      const emailMatched = contact.emails.some((email) => matchedEmails.has(email));
      const phoneMatched = contact.phones.some((phone) => {
        const digits = phoneDigitsOnly(phone);
        return digits.length >= 7 && matchedPhoneDigits.has(digits);
      });

      return !emailMatched && !phoneMatched;
    });

    return { unmatched };
  }

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
    setContactSearchQuery('');

    try {
      const { contacts, error } = await loadDeviceContacts();
      if (error) {
        setContactMessage(error);
        setContactMatches([]);
        setAllContacts([]);
        setUnmatchedContacts([]);
        return;
      }

      setAllContacts(contacts);

      const emails = contacts.flatMap((contact) => contact.emails);
      const phones = contacts.flatMap((contact) => contact.phones);

      try {
        const matches = await matchContactsToProfiles({ emails, phones });
        const { unmatched } = splitMatchedContacts(contacts, matches);

        setContactMatches(matches);
        setUnmatchedContacts(unmatched);
        setContactMessage(
          `${matches.length} on LocateMate · ${unmatched.length} to invite · ${contacts.length} loaded`
        );
      } catch (matchError) {
        console.warn('Contact matching failed:', matchError);
        setContactMatches([]);
        setUnmatchedContacts(contacts);
        setContactMessage(
          matchError instanceof Error
            ? `${matchError.message} Showing your contacts for invites.`
            : 'Could not match contacts on LocateMate. You can still send invites.'
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load contacts. Try again.';
      setContactMessage(message);
      setContactMatches([]);
      setAllContacts([]);
      setUnmatchedContacts([]);
      Alert.alert('Contacts', message);
    } finally {
      setContactsLoaded(true);
      setLoadingContacts(false);
    }
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

          {contactsLoaded && allContacts.length > 0 ? (
            <FriendsSearchBar
              value={contactSearchQuery}
              onChangeText={setContactSearchQuery}
              onClear={() => setContactSearchQuery('')}
              placeholder="Search your contacts"
            />
          ) : null}

          {!contactsLoaded && !loadingContacts ? (
            <EmptyPanel
              icon={<Contact size={32} color={Colors.neutral[600]} />}
              title="Use your contacts"
              description="Tap Load contacts, allow access when prompted, then invite people via WhatsApp or Message."
            />
          ) : loadingContacts ? (
            <View style={styles.loadingPanel}>
              <ActivityIndicator color={Colors.primary[500]} size="large" />
              <Text textStyle={styles.loadingText}>Loading contacts...</Text>
            </View>
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
                    title={contactSearchQuery ? 'No matching contacts' : 'No contacts to show'}
                    description={
                      contactSearchQuery
                        ? `No contacts match "${contactSearchQuery}".`
                        : 'None of your contacts have a phone or email, or contact access was denied.'
                    }
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
