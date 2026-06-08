import React from 'react';
import { ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { MapPin, Plus } from 'lucide-react-native';
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
  onAddPlace?: () => void;
  onTogglePlaceVisible?: (place: Place) => void;
  onTogglePlaceNotify?: (place: Place) => void;
  onDeletePlace?: (place: Place) => void;
}

export function MembersAndPlacesList({
  friends,
  places,
  selectedFriendId,
  refreshing,
  onRefresh,
  onSelectFriend,
  onAddPlace,
  onTogglePlaceVisible,
  onTogglePlaceNotify,
  onDeletePlace,
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

      <Row spacing={8} alignment="center" style={styles.placesHeader}>
        <Text textStyle={styles.placesTitle}>Places</Text>
        {onAddPlace ? (
          <TouchableOpacity style={styles.addPlaceButton} onPress={onAddPlace}>
            <Plus size={16} color={Colors.primary[400]} />
            <Text textStyle={styles.addPlaceText}>Add</Text>
          </TouchableOpacity>
        ) : null}
      </Row>

      {places.length === 0 ? (
        <TouchableOpacity
          style={styles.emptyPlacesCard}
          onPress={onAddPlace}
          disabled={!onAddPlace}
        >
          <MapPin size={24} color={Colors.neutral[600]} />
          <Text textStyle={styles.emptyPlacesTitle}>No saved places yet</Text>
          <Text textStyle={styles.emptyPlacesText}>
            Add places like home or work. Your circle gets notified when you arrive or leave.
          </Text>
        </TouchableOpacity>
      ) : (
        places.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            onToggleVisible={onTogglePlaceVisible}
            onToggleNotify={onTogglePlaceNotify}
            onDelete={onDeletePlace}
          />
        ))
      )}
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
  placesHeader: {
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 16,
  },
  placesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral[0],
  },
  addPlaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.primary[900],
    borderWidth: 1,
    borderColor: Colors.primary[700],
  },
  addPlaceText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary[400],
  },
  emptyPlacesCard: {
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.neutral[900],
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.neutral[800],
  },
  emptyPlacesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[0],
  },
  emptyPlacesText: {
    fontSize: 14,
    color: Colors.neutral[500],
    textAlign: 'center',
    lineHeight: 20,
  },
});
