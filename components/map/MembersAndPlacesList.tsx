import React from 'react';
import { ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Row, Text } from '@/components/ExpoUI';
import { FriendLocationCard } from './FriendLocationCard';
import { PlaceCard } from './PlaceCard';
import { FriendMarker } from './types';
import { Place } from '@/types/database';
import { Colors } from '@/lib/theme';

interface MembersAndPlacesListProps {
  friends: FriendMarker[];
  places: Place[];
  selectedFriendId: string | null;
  refreshing: boolean;
  onRefresh: () => void;
  onSelectFriend: (friend: FriendMarker) => void;
}

export function MembersAndPlacesList({
  friends,
  places,
  selectedFriendId,
  refreshing,
  onRefresh,
  onSelectFriend,
}: MembersAndPlacesListProps) {
  return (
    <ScrollView
      style={styles.list}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.primary[500]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <Row spacing={8} alignment="center" style={styles.header}>
        <Text textStyle={styles.sectionTitle}>Circle Members</Text>
        <Text textStyle={styles.count}>{friends.length + 1} people</Text>
      </Row>

      {friends.map((friend) => (
        <FriendLocationCard
          key={friend.id}
          friend={friend}
          selected={selectedFriendId === friend.id}
          onPress={() => onSelectFriend(friend)}
        />
      ))}

      <Text textStyle={styles.placesTitle}>Places</Text>
      {places.map((place) => (
        <PlaceCard key={place.id} place={place} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  header: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral[0],
  },
  count: {
    fontSize: 14,
    color: Colors.neutral[500],
  },
  placesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral[0],
    marginTop: 32,
    marginBottom: 16,
  },
});
