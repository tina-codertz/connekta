import React, { useMemo, useState } from 'react';
import { StyleSheet, FlatList, View } from 'react-native';
import { Search, Users } from 'lucide-react-native';
import { Column, Text } from '@/components/ExpoUI';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { FriendsSearchBar } from '@/components/friends/FriendsSearchBar';
import { FriendLocationCard } from '@/components/map/FriendLocationCard';
import { PlaceCard } from '@/components/map/PlaceCard';
import { CircleMemberLocation, FriendMarker } from '@/components/map/types';
import { Place } from '@/types/database';
import { Colors } from '@/lib/theme';

interface MapSearchModalProps {
  visible: boolean;
  circleName?: string | null;
  friends: FriendMarker[];
  places: Place[];
  selectedFriendId: string | null;
  onClose: () => void;
  onSelectFriend: (friend: FriendMarker) => void;
}

type SearchResult =
  | { kind: 'member'; friend: FriendMarker }
  | { kind: 'place'; place: Place };

function friendToMember(friend: FriendMarker): CircleMemberLocation {
  return {
    id: friend.id,
    name: friend.name,
    avatar: friend.avatar,
    isSharing: true,
    canViewLocation: true,
    latitude: friend.latitude,
    longitude: friend.longitude,
    battery: friend.battery,
    isCharging: friend.isCharging,
    lastSeen: friend.lastSeen,
  };
}

function matchesQuery(text: string | null | undefined, query: string): boolean {
  if (!text) return false;
  return text.toLowerCase().includes(query);
}

export function MapSearchModal({
  visible,
  circleName,
  friends,
  places,
  selectedFriendId,
  onClose,
  onSelectFriend,
}: MapSearchModalProps) {
  const [query, setQuery] = useState('');

  const results = useMemo<SearchResult[]>(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    const memberResults = friends
      .filter((friend) => matchesQuery(friend.name, trimmed))
      .map((friend) => ({ kind: 'member' as const, friend }));

    const placeResults = places
      .filter(
        (place) =>
          matchesQuery(place.name, trimmed) || matchesQuery(place.address, trimmed)
      )
      .map((place) => ({ kind: 'place' as const, place }));

    return [...memberResults, ...placeResults];
  }, [friends, places, query]);

  function handleClose() {
    setQuery('');
    onClose();
  }

  function handleSelectFriend(friend: FriendMarker) {
    onSelectFriend(friend);
    handleClose();
  }

  return (
    <ModalSheet visible={visible} title="Search" onClose={handleClose}>
      <FriendsSearchBar
        value={query}
        onChangeText={setQuery}
        onClear={() => setQuery('')}
        placeholder="Search members or places"
      />

      {query.trim().length === 0 ? (
        <Column spacing={12} alignment="center" style={styles.emptyPanel}>
          <Search size={40} color={Colors.neutral[700]} />
          <Text textStyle={styles.emptyTitle}>
            {circleName ? `Search ${circleName}` : 'Select a circle first'}
          </Text>
          <Text textStyle={styles.emptyText}>
            Find circle members and saved places by name or address.
          </Text>
        </Column>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) =>
            item.kind === 'member' ? `member-${item.friend.id}` : `place-${item.place.id}`
          }
          renderItem={({ item }) =>
            item.kind === 'member' ? (
              <FriendLocationCard
                member={friendToMember(item.friend)}
                selected={selectedFriendId === item.friend.id}
                onPress={() => handleSelectFriend(item.friend)}
              />
            ) : (
              <PlaceCard place={item.place} />
            )
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Column spacing={8} alignment="center" style={styles.emptyPanel}>
              <Users size={32} color={Colors.neutral[700]} />
              <Text textStyle={styles.emptyText}>No results for "{query}"</Text>
            </Column>
          }
        />
      )}
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    flexGrow: 1,
  },
  emptyPanel: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral[0],
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: Colors.neutral[500],
    textAlign: 'center',
    lineHeight: 22,
  },
});
